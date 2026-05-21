@echo off
setlocal

set "BACKEND_URL=http://127.0.0.1:8000/api/simular-error/404/"
set "FRONTEND_URL=http://127.0.0.1:5173/error/404"

echo Simulando error 404 de forma controlada...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%BACKEND_URL%' -UseBasicParsing | Out-Null } catch { Write-Host ('Respuesta backend: ' + [int]$_.Exception.Response.StatusCode) }"
start "" "%FRONTEND_URL%"

echo Se abrio la pantalla del error 404.
pause
