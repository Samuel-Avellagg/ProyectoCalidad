import os
import time
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

app = Flask(__name__)
CORS(app)

PROJECT_SERVICE_URL = os.getenv("PROJECT_SERVICE_URL", "http://localhost:5001")
QA_SERVICE_URL = os.getenv("QA_SERVICE_URL", "http://localhost:5002")
METRICS_SERVICE_URL = os.getenv("METRICS_SERVICE_URL", "http://localhost:5003")
GATEWAY_PORT = int(os.getenv("GATEWAY_PORT", 5000))
TOKEN_CACHE = {}
TOKEN_CACHE_TTL_SECONDS = 60


# Valida el token Bearer en rutas protegidas usando caché en memoria de 60s para máximo rendimiento.
@app.before_request
def require_valid_session():
    if request.method == "OPTIONS":
        return None
    if request.path in ("/api/health",) or request.path.startswith("/api/auth/"):
        return None
    if not request.path.startswith("/api/"):
        return None

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Debes iniciar sesión para acceder a este recurso"}), 401

    token = auth_header.split(" ", 1)[1].strip()
    now = time.time()
    cached = TOKEN_CACHE.get(token)
    if cached and (now - cached["ts"]) < TOKEN_CACHE_TTL_SECONDS:
        return None

    try:
        res = requests.get(
            f"{PROJECT_SERVICE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
        if res.status_code == 200:
            TOKEN_CACHE[token] = {"ts": now, "user": res.json().get("user")}
            return None
        TOKEN_CACHE.pop(token, None)
        return jsonify({"error": "Sesión expirada o inválida"}), 401
    except requests.exceptions.RequestException:
        return jsonify({"error": "No fue posible validar la sesión con el servicio de autenticación"}), 503


# Reenvía la petición HTTP entrante al microservicio de destino conservando método, cabeceras, parámetros y cuerpo.
def forward_request(target_base_url: str, target_path: str):
    url = f"{target_base_url.rstrip('/')}/{target_path.lstrip('/')}"
    headers = {
        key: value
        for key, value in request.headers
        if key.lower() != "host"
    }
    try:
        resp = requests.request(
            method=request.method,
            url=url,
            headers=headers,
            params=request.args,
            data=request.get_data(),
            timeout=15,
        )
        excluded_headers = {"content-encoding", "content-length", "transfer-encoding", "connection"}
        response_headers = [
            (name, value)
            for name, value in resp.raw.headers.items()
            if name.lower() not in excluded_headers
        ]
        return Response(resp.content, resp.status_code, response_headers)
    except requests.exceptions.ConnectionError:
        return jsonify({
            "error": "Microservicio no disponible",
            "detail": f"No fue posible conectar con el servicio en {target_base_url}"
        }), 503
    except requests.exceptions.Timeout:
        return jsonify({
            "error": "Tiempo de espera agotado",
            "detail": f"El microservicio en {target_base_url} tardó demasiado en responder"
        }), 504


# Verifica el estado operativo del API Gateway y consulta la disponibilidad de los tres microservicios.
@app.route("/api/health", methods=["GET"])
def health_check():
    services = {
        "project_service": f"{PROJECT_SERVICE_URL}/health",
        "qa_service": f"{QA_SERVICE_URL}/health",
        "metrics_service": f"{METRICS_SERVICE_URL}/health",
    }
    status_report = {}
    for name, url in services.items():
        try:
            res = requests.get(url, timeout=3)
            status_report[name] = "online" if res.status_code == 200 else f"error ({res.status_code})"
        except requests.exceptions.RequestException:
            status_report[name] = "offline"

    return jsonify({
        "gateway": "online",
        "services": status_report
    }), 200


# Enruta las peticiones de la raíz de proyectos (/api/projects) hacia el microservicio project_service.
@app.route("/api/projects", methods=["GET", "POST"])
def proxy_projects_root():
    return forward_request(PROJECT_SERVICE_URL, "projects")


# Enruta las peticiones específicas de un proyecto (/api/projects/<subpath>) hacia el microservicio project_service.
@app.route("/api/projects/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def proxy_projects_subpath(subpath: str):
    return forward_request(PROJECT_SERVICE_URL, f"projects/{subpath}")


# Enruta todas las peticiones de aseguramiento de calidad (/api/qa/<subpath>) hacia el microservicio qa_service.
@app.route("/api/qa/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def proxy_qa_service(subpath: str):
    return forward_request(QA_SERVICE_URL, subpath)


# Enruta las peticiones de autenticación (/api/auth/<subpath>) hacia project_service.
@app.route("/api/auth/<path:subpath>", methods=["GET", "POST"])
def proxy_auth_service(subpath: str):
    return forward_request(PROJECT_SERVICE_URL, f"auth/{subpath}")


# Enruta todas las peticiones de indicadores e ISO 25010 (/api/metrics/<subpath>) hacia el microservicio metrics_service.
@app.route("/api/metrics/<path:subpath>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def proxy_metrics_service(subpath: str):
    return forward_request(METRICS_SERVICE_URL, subpath)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=GATEWAY_PORT, debug=True)

