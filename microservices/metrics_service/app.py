import ast
import os
import re
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase_client import supabase

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

app = Flask(__name__)
CORS(app)

SERVICE_PORT = int(os.getenv("PORT", 5003))

EXTENSION_LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "React JSX",
    ".ts": "TypeScript",
    ".tsx": "React TSX",
    ".java": "Java",
    ".cs": "C#",
    ".php": "PHP",
    ".html": "HTML",
    ".css": "CSS",
    ".sql": "SQL",
    ".json": "JSON",
    ".md": "Markdown",
}


# Calcula un porcentaje seguro redondeado a dos decimales evitando divisiones por cero.
def calculate_percentage(part: int, total: int) -> float:
    return round((part / total) * 100.0, 2) if total > 0 else 0.0


# Determina el nivel cualitativo de calidad según el puntaje promedio obtenido en ISO/IEC 25010.
def classify_iso_quality_level(score: float) -> str:
    if score >= 85.0:
        return "Excelente (Cumplimiento Alto ISO/IEC 25010)"
    if score >= 70.0:
        return "Aceptable (Cumplimiento Satisfactorio)"
    if score >= 50.0:
        return "En Riesgo (Requiere Plan de Mejora)"
    return "Crítico (No Cumple Estándar Mínimo)"


# Analiza estáticamente el contenido de un archivo de código fuente y extrae sus métricas y hallazgos.
def analyze_single_file(file_path: str, content: str) -> dict:
    _, ext = os.path.splitext(file_path.lower())
    language = EXTENSION_LANGUAGE_MAP.get(ext, "Otro")
    lines = content.splitlines()
    total_lines = len(lines)
    blank_lines = sum(1 for line in lines if not line.strip())

    comment_lines = 0
    todo_count = 0
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(("#", "//", "/*", "*", "--")):
            comment_lines += 1
        if "TODO" in stripped or "FIXME" in stripped:
            todo_count += 1

    code_lines = max(0, total_lines - blank_lines - comment_lines)
    functions_count = 0
    classes_count = 0
    long_functions = 0
    missing_docstrings = 0

    if ext == ".py":
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions_count += 1
                    end_lineno = getattr(node, "end_lineno", node.lineno)
                    if (end_lineno - node.lineno + 1) > 40:
                        long_functions += 1
                    if not ast.get_docstring(node):
                        missing_docstrings += 1
                elif isinstance(node, ast.ClassDef):
                    classes_count += 1
        except SyntaxError:
            pass
    elif ext in {".js", ".jsx", ".ts", ".tsx", ".java", ".cs", ".php"}:
        func_pattern = re.compile(r"\b(function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()")
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("class ") or " class " in stripped:
                classes_count += 1
            elif func_pattern.search(stripped) or re.match(r"^(?:async\s+)?\w+\s*\([^)]*\)\s*\{", stripped):
                functions_count += 1

    return {
        "path": file_path,
        "language": language,
        "total_lines": total_lines,
        "code_lines": code_lines,
        "comment_lines": comment_lines,
        "blank_lines": blank_lines,
        "functions_count": functions_count,
        "classes_count": classes_count,
        "todo_count": todo_count,
        "long_functions": long_functions,
        "missing_docstrings": missing_docstrings,
    }


# Comprueba que el microservicio de métricas e ISO 25010 se encuentra activo.
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"service": "metrics_service", "status": "online"}), 200


# Calcula los indicadores de calidad del proyecto (% pruebas aprobadas, % requisitos verificados y % defectos resueltos).
@app.route("/indicators/<int:project_id>", methods=["GET"])
def get_project_indicators(project_id: int):
    try:
        reqs = supabase.table("requirements").select("id, status").eq("project_id", project_id).execute().data
        tests = supabase.table("test_cases").select("id, execution_status").eq("project_id", project_id).execute().data
        defects = supabase.table("defects").select("id, status, severity").eq("project_id", project_id).execute().data
        evals = (
            supabase.table("iso25010_evaluations")
            .select("*")
            .eq("project_id", project_id)
            .order("evaluated_at", desc=True)
            .limit(1)
            .execute()
            .data
        )

        total_reqs = len(reqs)
        verified_reqs = sum(1 for r in reqs if r.get("status") == "Verificado")

        total_tests = len(tests)
        passed_tests = sum(1 for t in tests if t.get("execution_status") == "Aprobado")
        failed_tests = sum(1 for t in tests if t.get("execution_status") == "Fallido")
        blocked_tests = sum(1 for t in tests if t.get("execution_status") == "Bloqueado")
        pending_tests = sum(1 for t in tests if t.get("execution_status") == "Pendiente")

        total_defects = len(defects)
        resolved_defects = sum(1 for d in defects if d.get("status") in {"Resuelto", "Cerrado"})
        open_defects = total_defects - resolved_defects

        latest_eval = evals[0] if evals else None

        return jsonify({
            "project_id": project_id,
            "indicators": {
                "verified_requirements_percentage": calculate_percentage(verified_reqs, total_reqs),
                "passed_tests_percentage": calculate_percentage(passed_tests, total_tests),
                "resolved_defects_percentage": calculate_percentage(resolved_defects, total_defects),
            },
            "counts": {
                "requirements": {
                    "total": total_reqs,
                    "verified": verified_reqs,
                },
                "test_cases": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "blocked": blocked_tests,
                    "pending": pending_tests,
                },
                "defects": {
                    "total": total_defects,
                    "resolved": resolved_defects,
                    "open": open_defects,
                },
            },
            "latest_iso25010_evaluation": latest_eval,
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Consulta el historial de evaluaciones ISO/IEC 25010 registradas permitiendo filtrar por proyecto.
@app.route("/evaluations", methods=["GET"])
def list_evaluations():
    try:
        project_id = request.args.get("project_id", type=int)
        query = supabase.table("iso25010_evaluations").select("*").order("evaluated_at", desc=True)
        if project_id:
            query = query.eq("project_id", project_id)
        response = query.execute()
        return jsonify({"data": response.data}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Registra una nueva evaluación ISO/IEC 25010 con métricas de adecuación funcional, eficiencia y mantenibilidad.
@app.route("/evaluations", methods=["POST"])
def create_evaluation():
    try:
        payload = request.get_json(silent=True) or {}
        project_id = payload.get("project_id")
        evaluator = (payload.get("evaluator") or "").strip()

        if not project_id or not evaluator:
            return jsonify({"error": "Los campos 'project_id' y 'evaluator' son obligatorios"}), 400

        try:
            func_score = float(payload.get("functional_suitability_score"))
            perf_score = float(payload.get("performance_efficiency_score"))
            maint_score = float(payload.get("maintainability_score"))
        except (TypeError, ValueError):
            return jsonify({
                "error": "Las métricas de adecuación funcional, eficiencia y mantenibilidad deben ser valores numéricos"
            }), 400

        for name, val in (
            ("functional_suitability_score", func_score),
            ("performance_efficiency_score", perf_score),
            ("maintainability_score", maint_score),
        ):
            if not (0.0 <= val <= 100.0):
                return jsonify({"error": f"El campo '{name}' debe estar entre 0 y 100"}), 400

        response = supabase.table("iso25010_evaluations").insert({
            "project_id": project_id,
            "evaluator": evaluator,
            "functional_suitability_score": func_score,
            "performance_efficiency_score": perf_score,
            "maintainability_score": maint_score,
            "observations": (payload.get("observations") or "").strip(),
        }).execute()

        created = response.data[0]
        overall = float(created.get("overall_score", round((func_score + perf_score + maint_score) / 3.0, 2)))

        return jsonify({
            "message": "Evaluación ISO/IEC 25010 registrada exitosamente",
            "quality_level": classify_iso_quality_level(overall),
            "data": created,
        }), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Audita una colección de archivos o carpeta de proyecto extrayendo parámetros de código y mantenibilidad.
@app.route("/audit-code", methods=["POST"])
def audit_code():
    try:
        payload = request.get_json(silent=True) or {}
        files = payload.get("files") or []
        source_name = (payload.get("source_name") or "Proyecto Local").strip()
        project_id = payload.get("project_id")
        save_audit = bool(payload.get("save", False))

        if not files:
            return jsonify({"error": "Debes enviar al menos un archivo para auditar"}), 400

        file_reports = []
        language_counts = Counter()
        findings = []

        for item in files:
            path = item.get("path") or item.get("name") or "archivo_desconocido"
            content = item.get("content") or ""
            report = analyze_single_file(path, content)
            file_reports.append(report)
            language_counts[report["language"]] += 1

            if report["total_lines"] > 300:
                findings.append(f"Archivo extenso (>300 líneas): {path} ({report['total_lines']} líneas)")
            if report["long_functions"] > 0:
                findings.append(f"{report['long_functions']} función(es) larga(s) (>40 líneas) en {path}")
            if report["todo_count"] > 0:
                findings.append(f"{report['todo_count']} marcador(es) TODO/FIXME pendientes en {path}")

        total_files = len(file_reports)
        total_lines = sum(r["total_lines"] for r in file_reports)
        code_lines = sum(r["code_lines"] for r in file_reports)
        comment_lines = sum(r["comment_lines"] for r in file_reports)
        blank_lines = sum(r["blank_lines"] for r in file_reports)
        functions_count = sum(r["functions_count"] for r in file_reports)
        classes_count = sum(r["classes_count"] for r in file_reports)
        long_functions_total = sum(r["long_functions"] for r in file_reports)
        todos_total = sum(r["todo_count"] for r in file_reports)

        comment_density = calculate_percentage(comment_lines, code_lines + comment_lines)
        avg_lines_per_file = round(total_lines / total_files, 2) if total_files > 0 else 0.0
        avg_lines_per_function = round(code_lines / functions_count, 2) if functions_count > 0 else 0.0

        # Puntaje heurístico de mantenibilidad (0-100) basado en densidad de comentarios y hallazgos.
        score = 85.0
        if comment_density >= 10.0:
            score += 10.0
        elif comment_density < 3.0 and code_lines > 30:
            score -= 10.0
            findings.append("Densidad de comentarios baja (<3%) respecto al volumen de código.")
        score -= min(15.0, long_functions_total * 3.0)
        score -= min(10.0, todos_total * 1.5)
        large_files_count = sum(1 for r in file_reports if r["total_lines"] > 300)
        score -= min(10.0, large_files_count * 2.5)
        suggested_score = round(max(20.0, min(100.0, score)), 2)

        audit_result = {
            "source_name": source_name,
            "total_files": total_files,
            "total_lines": total_lines,
            "code_lines": code_lines,
            "comment_lines": comment_lines,
            "blank_lines": blank_lines,
            "comment_density": comment_density,
            "functions_count": functions_count,
            "classes_count": classes_count,
            "avg_lines_per_file": avg_lines_per_file,
            "avg_lines_per_function": avg_lines_per_function,
            "languages": dict(language_counts),
            "suggested_maintainability_score": suggested_score,
            "quality_level": classify_iso_quality_level(suggested_score),
            "findings": findings[:25],
            "files": sorted(file_reports, key=lambda x: x["total_lines"], reverse=True)[:50],
        }

        saved_in_db = False
        if save_audit and project_id:
            try:
                supabase.table("code_audits").insert({
                    "project_id": project_id,
                    "source_name": source_name,
                    "total_files": total_files,
                    "total_lines": total_lines,
                    "code_lines": code_lines,
                    "comment_lines": comment_lines,
                    "comment_density": comment_density,
                    "functions_count": functions_count,
                    "classes_count": classes_count,
                    "suggested_maintainability_score": suggested_score,
                    "summary_json": {
                        "languages": dict(language_counts),
                        "findings": findings[:25],
                    },
                }).execute()
                saved_in_db = True
            except Exception:
                saved_in_db = False

        audit_result["saved_in_db"] = saved_in_db
        return jsonify({"message": "Auditoría de código completada", "data": audit_result}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Lista el historial de auditorías de código guardadas en Supabase filtrando por proyecto si se indica.
@app.route("/audits", methods=["GET"])
def list_audits():
    try:
        project_id = request.args.get("project_id", type=int)
        query = supabase.table("code_audits").select("*").order("audited_at", desc=True)
        if project_id:
            query = query.eq("project_id", project_id)
        response = query.execute()
        return jsonify({"data": response.data}), 200
    except Exception:
        return jsonify({"data": []}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=SERVICE_PORT, debug=True)
