import os
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase_client import supabase

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

app = Flask(__name__)
CORS(app)

SERVICE_PORT = int(os.getenv("PORT", 5002))

VALID_REQ_TYPES = {"Funcional", "No Funcional"}
VALID_PRIORITIES = {"Alta", "Media", "Baja"}
VALID_REQ_STATUSES = {"Pendiente", "En Progreso", "Verificado", "Rechazado"}
VALID_EXECUTION_STATUSES = {"Pendiente", "Aprobado", "Fallido", "Bloqueado"}
VALID_SEVERITIES = {"Crítica", "Alta", "Media", "Baja"}
VALID_DEFECT_STATUSES = {"Abierto", "En Reparación", "Resuelto", "Cerrado"}


# Comprueba que el microservicio de QA se encuentra activo y respondiendo peticiones.
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"service": "qa_service", "status": "online"}), 200


# Lista los requisitos registrados permitiendo filtrar opcionalmente por proyecto o estado.
@app.route("/requirements", methods=["GET"])
def list_requirements():
    try:
        project_id = request.args.get("project_id", type=int)
        status = request.args.get("status")
        query = supabase.table("requirements").select("*").order("created_at", desc=True)
        if project_id:
            query = query.eq("project_id", project_id)
        if status:
            query = query.eq("status", status)
        response = query.execute()
        return jsonify({"data": response.data}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Registra un nuevo requisito funcional o no funcional asociado a un proyecto existente.
@app.route("/requirements", methods=["POST"])
def create_requirement():
    try:
        payload = request.get_json(silent=True) or {}
        project_id = payload.get("project_id")
        code = (payload.get("code") or "").strip().upper()
        title = (payload.get("title") or "").strip()
        description = (payload.get("description") or "").strip()
        req_type = payload.get("req_type", "Funcional")
        priority = payload.get("priority", "Media")
        status = payload.get("status", "Pendiente")

        if not project_id or not code or not title:
            return jsonify({"error": "Los campos 'project_id', 'code' y 'title' son obligatorios"}), 400
        if req_type not in VALID_REQ_TYPES:
            return jsonify({"error": f"Tipo inválido. Valores permitidos: {sorted(VALID_REQ_TYPES)}"}), 400
        if priority not in VALID_PRIORITIES:
            return jsonify({"error": f"Prioridad inválida. Valores permitidos: {sorted(VALID_PRIORITIES)}"}), 400
        if status not in VALID_REQ_STATUSES:
            return jsonify({"error": f"Estado inválido. Valores permitidos: {sorted(VALID_REQ_STATUSES)}"}), 400

        response = supabase.table("requirements").insert({
            "project_id": project_id,
            "code": code,
            "title": title,
            "description": description,
            "req_type": req_type,
            "priority": priority,
            "status": status,
        }).execute()
        return jsonify({"message": "Requisito registrado exitosamente", "data": response.data[0]}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Actualiza el estado, la prioridad o la descripción de un requisito específico.
@app.route("/requirements/<int:req_id>", methods=["PUT", "PATCH"])
def update_requirement(req_id: int):
    try:
        payload = request.get_json(silent=True) or {}
        update_data = {}
        for field in ("code", "title", "description", "req_type", "priority", "status"):
            if field in payload:
                update_data[field] = payload[field]

        if not update_data:
            return jsonify({"error": "No se enviaron campos válidos para actualizar"}), 400
        if "status" in update_data and update_data["status"] not in VALID_REQ_STATUSES:
            return jsonify({"error": f"Estado inválido. Valores permitidos: {sorted(VALID_REQ_STATUSES)}"}), 400

        response = supabase.table("requirements").update(update_data).eq("id", req_id).execute()
        if not response.data:
            return jsonify({"error": "Requisito no encontrado"}), 404
        return jsonify({"message": "Requisito actualizado exitosamente", "data": response.data[0]}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Lista los casos de prueba permitiendo filtrar por proyecto o por requisito asociado.
@app.route("/test-cases", methods=["GET"])
def list_test_cases():
    try:
        project_id = request.args.get("project_id", type=int)
        requirement_id = request.args.get("requirement_id", type=int)
        query = supabase.table("test_cases").select("*").order("created_at", desc=True)
        if project_id:
            query = query.eq("project_id", project_id)
        if requirement_id:
            query = query.eq("requirement_id", requirement_id)
        response = query.execute()
        return jsonify({"data": response.data}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Crea un nuevo caso de prueba vinculado a un requisito y a un proyecto.
@app.route("/test-cases", methods=["POST"])
def create_test_case():
    try:
        payload = request.get_json(silent=True) or {}
        project_id = payload.get("project_id")
        requirement_id = payload.get("requirement_id")
        code = (payload.get("code") or "").strip().upper()
        title = (payload.get("title") or "").strip()
        description = (payload.get("description") or "").strip()
        expected_result = (payload.get("expected_result") or "").strip()
        execution_status = payload.get("execution_status", "Pendiente")

        if not project_id or not requirement_id or not code or not title:
            return jsonify({"error": "Los campos 'project_id', 'requirement_id', 'code' y 'title' son obligatorios"}), 400
        if execution_status not in VALID_EXECUTION_STATUSES:
            return jsonify({"error": f"Estado de ejecución inválido: {sorted(VALID_EXECUTION_STATUSES)}"}), 400

        response = supabase.table("test_cases").insert({
            "project_id": project_id,
            "requirement_id": requirement_id,
            "code": code,
            "title": title,
            "description": description,
            "expected_result": expected_result,
            "execution_status": execution_status,
        }).execute()
        return jsonify({"message": "Caso de prueba creado exitosamente", "data": response.data[0]}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Registra el resultado de ejecución de un caso de prueba (Aprobado, Fallido, Bloqueado o Pendiente).
@app.route("/test-cases/<int:test_case_id>/execute", methods=["PUT", "PATCH"])
def execute_test_case(test_case_id: int):
    try:
        payload = request.get_json(silent=True) or {}
        execution_status = payload.get("execution_status")
        executed_by = (payload.get("executed_by") or "Tester QA").strip()

        if execution_status not in VALID_EXECUTION_STATUSES:
            return jsonify({"error": f"Estado de ejecución inválido. Permitidos: {sorted(VALID_EXECUTION_STATUSES)}"}), 400

        response = supabase.table("test_cases").update({
            "execution_status": execution_status,
            "executed_by": executed_by,
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", test_case_id).execute()

        if not response.data:
            return jsonify({"error": "Caso de prueba no encontrado"}), 404
        return jsonify({"message": "Ejecución registrada exitosamente", "data": response.data[0]}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Obtiene la lista de defectos registrados filtrando opcionalmente por proyecto, caso de prueba o estado.
@app.route("/defects", methods=["GET"])
def list_defects():
    try:
        project_id = request.args.get("project_id", type=int)
        test_case_id = request.args.get("test_case_id", type=int)
        status = request.args.get("status")
        query = supabase.table("defects").select("*").order("created_at", desc=True)
        if project_id:
            query = query.eq("project_id", project_id)
        if test_case_id:
            query = query.eq("test_case_id", test_case_id)
        if status:
            query = query.eq("status", status)
        response = query.execute()
        return jsonify({"data": response.data}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Registra un nuevo defecto vinculado a un caso de prueba con su severidad y responsable asignado.
@app.route("/defects", methods=["POST"])
def create_defect():
    try:
        payload = request.get_json(silent=True) or {}
        project_id = payload.get("project_id")
        test_case_id = payload.get("test_case_id")
        title = (payload.get("title") or "").strip()
        description = (payload.get("description") or "").strip()
        severity = payload.get("severity", "Media")
        responsible = (payload.get("responsible") or "").strip()
        status = payload.get("status", "Abierto")

        if not project_id or not test_case_id or not title or not responsible:
            return jsonify({"error": "Los campos 'project_id', 'test_case_id', 'title' y 'responsible' son obligatorios"}), 400
        if severity not in VALID_SEVERITIES:
            return jsonify({"error": f"Severidad inválida. Permitidas: {sorted(VALID_SEVERITIES)}"}), 400
        if status not in VALID_DEFECT_STATUSES:
            return jsonify({"error": f"Estado de defecto inválido. Permitidos: {sorted(VALID_DEFECT_STATUSES)}"}), 400

        response = supabase.table("defects").insert({
            "project_id": project_id,
            "test_case_id": test_case_id,
            "title": title,
            "description": description,
            "severity": severity,
            "responsible": responsible,
            "status": status,
        }).execute()
        return jsonify({"message": "Defecto registrado exitosamente", "data": response.data[0]}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Actualiza el estado, severidad o responsable de un defecto existente y registra la fecha de resolución si aplica.
@app.route("/defects/<int:defect_id>", methods=["PUT", "PATCH"])
def update_defect(defect_id: int):
    try:
        payload = request.get_json(silent=True) or {}
        update_data = {}
        for field in ("title", "description", "severity", "responsible", "status"):
            if field in payload:
                update_data[field] = payload[field]

        if not update_data:
            return jsonify({"error": "No se enviaron campos válidos para actualizar"}), 400
        if "status" in update_data:
            if update_data["status"] not in VALID_DEFECT_STATUSES:
                return jsonify({"error": f"Estado inválido. Permitidos: {sorted(VALID_DEFECT_STATUSES)}"}), 400
            if update_data["status"] in {"Resuelto", "Cerrado"}:
                update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("defects").update(update_data).eq("id", defect_id).execute()
        if not response.data:
            return jsonify({"error": "Defecto no encontrado"}), 404
        return jsonify({"message": "Defecto actualizado exitosamente", "data": response.data[0]}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=SERVICE_PORT, debug=True)
