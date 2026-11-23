# QualityCheck - Monorepo de Gestión y Evaluación de Calidad de Software (ISO/IEC 25010)

Arquitectura basada en **Microservicios Independientes en Python 3.12 (Flask)**, **API Gateway centralizado**, **Base de Datos en Supabase (PostgreSQL)** y **Frontend en React**. Diseñado para trabajo colaborativo en equipo sin requerir Docker.

## Arquitectura y Puertos Locales

```
[ Frontend React (:5173) ]
            │
            ▼  (Peticiones HTTP a /api/*)
[   API Gateway (:5000)  ]
     ├──► /api/projects/* ──► [ project_service (:5001) ] ──┐
     ├──► /api/qa/*       ──► [   qa_service    (:5002) ] ──┼──► [ Supabase PostgreSQL ]
     └──► /api/metrics/*  ──► [ metrics_service (:5003) ] ──┘
```

## Propuesta de División de Trabajo en el Equipo

| Integrante | Módulos Asignados | Directorio Principal | Puerto |
| :--- | :--- | :--- | :--- |
| **Sebastián** | API Gateway + Microservicio de Proyectos + Base Frontend | `api_gateway/` y `microservices/project_service/` | `5000`, `5001` |
| **Fabián** | Microservicio de QA (Requisitos, Casos de Prueba y Defectos) + Vistas QA | `microservices/qa_service/` | `5002` |
| **Samuel** | Microservicio de Métricas e ISO/IEC 25010 + Dashboard de Indicadores | `microservices/metrics_service/` | `5003` |

## Configuración Inicial de Base de Datos (Supabase)

1. Crear un proyecto gratuito en [Supabase](https://supabase.com/).
2. Ir a **SQL Editor** en el panel de Supabase.
3. Copiar y ejecutar el contenido completo del archivo [`database/supabase_schema.sql`](./database/supabase_schema.sql).
4. Ir a **Project Settings > API** y copiar `Project URL` (`SUPABASE_URL`) y `anon public` key (`SUPABASE_KEY`).
5. En cada microservicio (`project_service`, `qa_service`, `metrics_service`), copiar `.env.example` a `.env` y pegar ambas credenciales.

