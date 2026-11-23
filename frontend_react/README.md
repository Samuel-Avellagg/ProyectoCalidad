# Frontend React (`frontend_react`) - QualityCheck

Interfaz web desarrollada en **React 18 + Vite** para gestionar proyectos, requisitos, casos de prueba, defectos y evaluaciones bajo el estándar **ISO/IEC 25010**.

Se comunica exclusivamente con el **API Gateway** (`http://localhost:5000/api`), desacoplando al cliente de los puertos internos de cada microservicio.

## Ejecución en Local (Sin Docker)

1. Abrir una terminal y ubicarse en la carpeta del frontend:
   ```bash
   cd frontend_react
   ```
2. Instalar las dependencias de Node.js:
   ```bash
   npm install
   ```
3. Configurar las variables de entorno copiando `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

