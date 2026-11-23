# Microservicio de QA (`qa_service`)

Gestiona el ciclo de vida de **Requisitos**, **Casos de Prueba** y **Defectos** en Supabase. Se ejecuta de forma independiente en el puerto `5002`.

## Endpoints Disponibles

| Método | Ruta Interna | Ruta vía API Gateway | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | `/api/health` | Estado de salud del microservicio |
| `GET` | `/requirements` | `/api/qa/requirements` | Lista requisitos (filtrable con `?project_id=1`) |
| `POST` | `/requirements` | `/api/qa/requirements` | Registra un requisito funcional o no funcional |
| `PUT/PATCH` | `/requirements/<id>` | `/api/qa/requirements/<id>` | Actualiza estado o prioridad de un requisito |
| `GET` | `/test-cases` | `/api/qa/test-cases` | Lista casos de prueba (`?project_id=1&requirement_id=2`) |
| `POST` | `/test-cases` | `/api/qa/test-cases` | Diseña y registra un caso de prueba asociado a un requisito |
| `PUT/PATCH` | `/test-cases/<id>/execute` | `/api/qa/test-cases/<id>/execute` | Registra ejecución (`Aprobado`, `Fallido`, `Bloqueado`) |
| `GET` | `/defects` | `/api/qa/defects` | Lista defectos (`?project_id=1&test_case_id=3`) |
| `POST` | `/defects` | `/api/qa/defects` | Registra un defecto con severidad y responsable |
| `PUT/PATCH` | `/defects/<id>` | `/api/qa/defects/<id>` | Actualiza el estado o responsable de un defecto |

## Ejecución en Local (Sin Docker)

1. Ubicarse en el directorio del servicio:
   ```bash
   cd microservices/qa_service
   ```
2. Crear y activar el entorno virtual en Python 3.12:
   ```bash
   # En Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # En Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   Completa `SUPABASE_URL` y `SUPABASE_KEY` en `.env`.
5. Iniciar el servicio:
   ```bash
   python app.py
   ```
   Disponible en `http://localhost:5002`.

