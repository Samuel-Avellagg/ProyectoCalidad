# Script para inicializar la BD (si faltan tablas) e iniciar todos los servicios de QualityCheck
$PythonExe = "C:\Users\sebastian\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

Write-Host "Verificando tablas en base de datos..." -ForegroundColor Yellow
& $PythonExe database/init_db.py

Write-Host "Iniciando microservicios, API Gateway y Frontend React..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$PythonExe' microservices/project_service/app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$PythonExe' microservices/qa_service/app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$PythonExe' microservices/metrics_service/app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$PythonExe' api_gateway/app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Todos los servicios han sido lanzados:" -ForegroundColor Green
Write-Host " - Project Service : http://localhost:5001"
Write-Host " - QA Service      : http://localhost:5002"
Write-Host " - Metrics Service : http://localhost:5003"
Write-Host " - API Gateway     : http://localhost:5000/api/health"
Write-Host " - Frontend React  : http://localhost:5173"
