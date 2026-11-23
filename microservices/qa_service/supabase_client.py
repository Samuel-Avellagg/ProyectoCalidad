import os
from dotenv import load_dotenv
from supabase import create_client, Client

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")


# Inicializa y retorna la instancia única del cliente de Supabase usando las variables de entorno.
def init_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Error de configuración: SUPABASE_URL y SUPABASE_KEY deben estar definidos en el archivo .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


supabase: Client = init_supabase_client()
