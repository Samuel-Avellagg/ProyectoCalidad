import os
import sys
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "supabase_schema.sql")

REQUIRED_TABLES = [
    "users",
    "projects",
    "requirements",
    "test_cases",
    "defects",
    "iso25010_evaluations",
    "code_audits",
]


# Carga variables de entorno desde database/.env o desde el .env de project_service como respaldo.
def load_environment():
    db_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    root_env = os.path.join(BASE_DIR, ".env")
    svc_env = os.path.join(BASE_DIR, "microservices", "project_service", ".env")
    for env_file in (db_env, root_env, svc_env):
        if os.path.exists(env_file):
            load_dotenv(dotenv_path=env_file, override=False)


# Verifica vía SDK de Supabase qué tablas existen actualmente en el esquema público.
def check_existing_tables_via_supabase() -> list[str]:
    from supabase import create_client

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_KEY", "")
    if not url or not key:
        return REQUIRED_TABLES

    client = create_client(url, key)
    missing = []
    for table in REQUIRED_TABLES:
        try:
            client.table(table).select("id").limit(1).execute()
        except Exception:
            missing.append(table)
    return missing


# Garantiza la existencia del usuario base admin / admin123 en la tabla users cuando está disponible.
def ensure_default_admin_user():
    from supabase import create_client
    from werkzeug.security import generate_password_hash

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_KEY", "")
    if not url or not key:
        return

    try:
        client = create_client(url, key)
        existing = client.table("users").select("id").eq("username", "admin").limit(1).execute()
        if not existing.data:
            client.table("users").insert({
                "username": "admin",
                "name": "Administrador",
                "email": "admin@qualitycheck.local",
                "password_hash": generate_password_hash("admin123"),
                "role": "admin",
            }).execute()
            print("[DB Init] Usuario base 'admin' creado correctamente.")
    except Exception:
        pass


# Ejecuta el script SQL idempotente contra PostgreSQL usando DATABASE_URL solo si faltan tablas.
def ensure_tables_exist():
    load_environment()
    missing_tables = check_existing_tables_via_supabase()

    if not missing_tables:
        print("[DB Init] Todas las tablas ya existen en Supabase. No se requieren cambios.")
        ensure_default_admin_user()
        return

    print(f"[DB Init] Tablas faltantes detectadas: {', '.join(missing_tables)}")
    database_url = os.getenv("DATABASE_URL", "").strip()

    if not database_url:
        print("[DB Init] AVISO: Para crear tablas automáticamente, configura DATABASE_URL en database/.env")
        print("[DB Init] Ejemplo: DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.cdfsvoqlvbuxthounsrm.supabase.co:5432/postgres")
        return

    try:
        import psycopg2
    except ImportError:
        print("[DB Init] Error: Instala 'psycopg2-binary' para ejecutar la creación automática de tablas.")
        return

    if not os.path.exists(SCHEMA_PATH):
        print(f"[DB Init] Error: No se encontró el archivo {SCHEMA_PATH}")
        return

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        sql_script = f.read()

    conn = None
    try:
        conn = psycopg2.connect(database_url, connect_timeout=10)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql_script)
        print("[DB Init] Tablas e índices verificados/creados exitosamente en Supabase.")
    except Exception as exc:
        print(f"[DB Init] No se pudo ejecutar el esquema SQL automáticamente: {exc}")
    finally:
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    ensure_tables_exist()
    sys.exit(0)
