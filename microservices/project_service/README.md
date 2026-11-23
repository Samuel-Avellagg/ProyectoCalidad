# Microservicio de Proyectos (`project_service`)

Gestiona el CRUD completo de los proyectos de software en la tabla `projects` de Supabase. Corre de forma independiente en el puerto `5001`.

## Endpoints Disponibles

| Método | Ruta Interna | Ruta vía API Gateway | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | `/api/health` | Verifica disponibilidad del servicio |
| `GET` | `/projects` | `/api/projects` | Lista todos los proyectos (filtrable con `?status=Activo`) |
| `GET` | `/projects/<id>` | `/api/projects/<id>` | Obtiene el detalle de un proyecto |
| `POST` | `/projects` | `/api/projects` | Crea un proyecto (`name`, `description`, `responsible`, `status`) |
| `PUT/PATCH` | `/projects/<id>` | `/api/projects/<id>` | Actualiza datos o estado de un proyecto |
| `DELETE` | `/projects/<id>` | `/api/projects/<id>` | Elimina un proyecto por su ID |

## Ejecución en Local (Sin Docker)

1. Abrir una terminal y ubicarse en el directorio del microservicio:
   ```bash
   cd microservices/project_service
   ```
2. Crear y activar el entorno virtual de Python 3.12:
   ```bash
   # En Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # En Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Instalar las dependencias del servicio:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar el archivo `.env` con las credenciales de Supabase:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y coloca tu `SUPABASE_URL` y `SUPABASE_KEY` (obtenidas en *Project Settings > API* de tu panel de Supabase).
5. Ejecutar el microservicio:
   ```bash
   python app.py
   ```
   El servicio estará escuchando en `http://localhost:5001`.

