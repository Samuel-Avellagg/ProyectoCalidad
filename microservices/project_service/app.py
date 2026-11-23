import os
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import check_password_hash
from supabase_client import supabase

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

app = Flask(__name__)
CORS(app)

SERVICE_PORT = int(os.getenv("PORT", 5001))
AUTH_SECRET = os.getenv("AUTH_SECRET", "qualitycheck-dev-secret-key")
TOKEN_SERIALIZER = URLSafeTimedSerializer(AUTH_SECRET)

BASE_ADMIN_USER = {
    "id": "admin-base",
    "username": "admin",
    "name": "Administrador",
    "email": "admin@qualitycheck.local",
    "role": "admin",
}

VALID_STATUSES = {"Planificación", "Activo", "En Pruebas", "Completado", "Pausado"}


# Comprueba que el microservicio de proyectos se encuentra activo y respondiendo correctamente.
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"service": "project_service", "status": "online"}), 200


# Obtiene la lista de todos los proyectos registrados en Supabase ordenados por fecha de creación.
@app.route("/projects", methods=["GET"])
def list_projects():
    try:
        status_filter = request.args.get("status")
        query = supabase.table("projects").select("*").order("created_at", desc=True)
        if status_filter:
            query = query.eq("status", status_filter)
        response = query.execute()
        return jsonify({"data": response.data}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Consulta el detalle de un proyecto específico a partir de su identificador único.
@app.route("/projects/<int:project_id>", methods=["GET"])
def get_project(project_id: int):
    try:
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not response.data:
            return jsonify({"error": "Proyecto no encontrado"}), 404
        return jsonify({"data": response.data[0]}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Registra un nuevo proyecto validando los campos obligatorios y el estado inicial permitido.
@app.route("/projects", methods=["POST"])
def create_project():
    try:
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        description = (payload.get("description") or "").strip()
        responsible = (payload.get("responsible") or "").strip()
        status = payload.get("status", "Activo")

        if not name or not responsible:
            return jsonify({"error": "Los campos 'name' y 'responsible' son obligatorios"}), 400
        if status not in VALID_STATUSES:
            return jsonify({"error": f"Estado inválido. Valores permitidos: { sorted(VALID_STATUSES) }"}), 400

        new_project = {
            "name": name,
            "description": description,
            "responsible": responsible,
            "status": status,
        }
        response = supabase.table("projects").insert(new_project).execute()
        return jsonify({"message": "Proyecto creado exitosamente", "data": response.data[0]}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Actualiza la información o el estado de un proyecto existente en la base de datos.
@app.route("/projects/<int:project_id>", methods=["PUT", "PATCH"])
def update_project(project_id: int):
    try:
        payload = request.get_json(silent=True) or {}
        update_data = {}

        for field in ("name", "description", "responsible", "status"):
            if field in payload:
                update_data[field] = payload[field]

        if not update_data:
            return jsonify({"error": "No se enviaron campos válidos para actualizar"}), 400
        if "status" in update_data and update_data["status"] not in VALID_STATUSES:
            return jsonify({"error": f"Estado inválido. Valores permitidos: { sorted(VALID_STATUSES) }"}), 400

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("projects").update(update_data).eq("id", project_id).execute()
        if not response.data:
            return jsonify({"error": "Proyecto no encontrado"}), 404
        return jsonify({"message": "Proyecto actualizado exitosamente", "data": response.data[0]}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Elimina un proyecto y sus registros asociados en cascada mediante su identificador.
@app.route("/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id: int):
    try:
        response = supabase.table("projects").delete().eq("id", project_id).execute()
        if not response.data:
            return jsonify({"error": "Proyecto no encontrado"}), 404
        return jsonify({"message": "Proyecto eliminado correctamente"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Genera un token firmado de sesión para usuarios locales o administrador base.
def create_local_token(user_dict: dict) -> str:
    return TOKEN_SERIALIZER.dumps(user_dict, salt="qc-auth")


# Valida un token firmado local y devuelve el perfil del usuario o None si es inválido.
def verify_local_token(token: str):
    try:
        return TOKEN_SERIALIZER.loads(token, salt="qc-auth", max_age=86400)
    except (BadSignature, SignatureExpired):
        return None


# Serializa los datos esenciales de un usuario de Supabase Auth para el frontend.
def serialize_auth_user(user) -> dict:
    metadata = getattr(user, "user_metadata", None) or {}
    email = getattr(user, "email", "") or ""
    return {
        "id": str(getattr(user, "id", "")),
        "email": email,
        "name": metadata.get("full_name") or email.split("@")[0] or "Usuario",
    }


# Registra un nuevo usuario confirmado en Supabase Auth y devuelve su token de sesión.
@app.route("/auth/register", methods=["POST"])
def register_user():
    try:
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""

        if not name or not email or len(password) < 6:
            return jsonify({"error": "Nombre, correo válido y contraseña (mínimo 6 caracteres) son obligatorios"}), 400

        supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": name},
        })
        auth_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if not auth_res.session or not auth_res.user:
            return jsonify({"error": "Usuario creado, pero no fue posible iniciar sesión automáticamente"}), 500

        return jsonify({
            "message": "Cuenta creada exitosamente",
            "token": auth_res.session.access_token,
            "user": serialize_auth_user(auth_res.user),
        }), 201
    except Exception as exc:
        msg = str(exc)
        status_code = 409 if "already" in msg.lower() or "registered" in msg.lower() else 400
        return jsonify({"error": msg}), status_code


# Autentica al usuario administrador base, usuarios de tabla local o Supabase Auth y devuelve token y perfil.
@app.route("/auth/login", methods=["POST"])
def login_user():
    try:
        payload = request.get_json(silent=True) or {}
        identifier = (payload.get("identifier") or payload.get("email") or payload.get("username") or "").strip().lower()
        password = payload.get("password") or ""

        if not identifier or not password:
            return jsonify({"error": "Debes ingresar usuario/correo y contraseña"}), 400

        if identifier in ("admin", "admin@qualitycheck.local") and password == "admin123":
            token = create_local_token(BASE_ADMIN_USER)
            return jsonify({
                "message": "Sesión de administrador iniciada",
                "token": token,
                "user": BASE_ADMIN_USER,
            }), 200

        try:
            db_res = supabase.table("users").select("*").or_(f"username.eq.{identifier},email.eq.{identifier}").limit(1).execute()
            if db_res.data:
                row = db_res.data[0]
                if check_password_hash(row.get("password_hash", ""), password):
                    user_profile = {
                        "id": str(row["id"]),
                        "username": row.get("username"),
                        "name": row.get("name"),
                        "email": row.get("email") or row.get("username"),
                        "role": row.get("role", "evaluator"),
                    }
                    return jsonify({
                        "message": "Sesión iniciada correctamente",
                        "token": create_local_token(user_profile),
                        "user": user_profile,
                    }), 200
        except Exception:
            pass

        auth_res = supabase.auth.sign_in_with_password({"email": identifier, "password": password})
        if not auth_res.session or not auth_res.user:
            return jsonify({"error": "Credenciales inválidas"}), 401

        return jsonify({
            "message": "Sesión iniciada correctamente",
            "token": auth_res.session.access_token,
            "user": serialize_auth_user(auth_res.user),
        }), 200
    except Exception:
        return jsonify({"error": "Usuario/correo o contraseña incorrectos"}), 401


# Verifica el token Bearer enviado por el cliente (local o Supabase Auth) y devuelve el usuario autenticado.
@app.route("/auth/me", methods=["GET"])
def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Token de autorización requerido"}), 401

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return jsonify({"error": "Token inválido"}), 401

    local_user = verify_local_token(token)
    if local_user:
        return jsonify({"user": local_user}), 200

    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            return jsonify({"error": "Sesión expirada o inválida"}), 401
        return jsonify({"user": serialize_auth_user(user_res.user)}), 200
    except Exception:
        return jsonify({"error": "Sesión expirada o inválida"}), 401


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=SERVICE_PORT, debug=True)
