# Microservicio de Métricas e ISO/IEC 25010 (`metrics_service`)

Calcula indicadores cuantitativos de calidad de software y gestiona las evaluaciones bajo el estándar **ISO/IEC 25010** (Adecuación Funcional, Eficiencia de Desempeño y Mantenibilidad). Se ejecuta de forma independiente en el puerto `5003`.

## Endpoints Disponibles

| Método | Ruta Interna | Ruta vía API Gateway | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | `/api/health` | Estado de salud del microservicio |
| `GET` | `/indicators/<project_id>` | `/api/metrics/indicators/<project_id>` | Calcula `% pruebas aprobadas`, `% requisitos verificados` y `% defectos resueltos` |
| `GET` | `/evaluations` | `/api/metrics/evaluations` | Consulta evaluaciones ISO/IEC 25010 (`?project_id=1`) |
| `POST` | `/evaluations` | `/api/metrics/evaluations` | Registra evaluación de Adecuación Funcional, Eficiencia y Mantenibilidad (0-100) |

## Ejecución en Local (Sin Docker)

1. Ubicarse en el directorio del servicio:
   ```bash
   cd microservices/metrics_service
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
   Disponible en `http://localhost:5003`.

