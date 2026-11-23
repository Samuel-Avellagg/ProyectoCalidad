# API Gateway - QualityCheck

Punto de entrada único (Single Entry Point) para el frontend en React. Recibe todas las peticiones en el puerto `5000` bajo el prefijo `/api/*` y las redirige al microservicio correspondiente.

## Tabla de Enrutamiento

| Ruta en el API Gateway | Microservicio Destino | Puerto por Defecto |
| :--- | :--- | :--- |
| `GET /api/health` | Estado del Gateway y de todos los microservicios | `5000` |
| `/api/projects` y `/api/projects/*` | `project_service` (`/projects/*`) | `5001` |
| `/api/qa/*` | `qa_service` (`/requirements`, `/test-cases`, `/defects`) | `5002` |
| `/api/metrics/*` | `metrics_service` (`/indicators/*`, `/evaluations/*`) | `5003` |

## Ejecución en Local (Sin Docker)

1. Abrir una terminal y ubicarse en la carpeta del servicio:
   ```bash
   cd api_gateway
   ```
2. Crear y activar un entorno virtual en Python 3.12:
   ```bash
   # En Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # En Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Instalar las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar las variables de entorno copiando `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
5. Iniciar el servidor:
   ```bash
   python app.py
   ```
   El API Gateway quedará disponible en `http://localhost:5000`.

