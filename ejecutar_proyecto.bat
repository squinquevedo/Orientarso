@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=5173"
set "FRONTEND_URL=http://127.0.0.1:%FRONTEND_PORT%/"
set "PYTHON_EXE=%PROJECT_DIR%venv\Scripts\python.exe"

title Iniciando proyecto Orientarso
echo.
echo ==========================================
echo   Iniciando proyecto
echo ==========================================
echo.

cd /d "%PROJECT_DIR%"

where py >nul 2>nul
if errorlevel 1 where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python no esta disponible en el PATH.
    echo Instala Python o agregalo al PATH y vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js/npm no esta disponible en el PATH.
    echo Instala Node.js y vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

echo Verificando entorno virtual de Python...
if not exist "%PROJECT_DIR%venv\pyvenv.cfg" (
    echo Creando entorno virtual en venv...
    py -m venv "%PROJECT_DIR%venv" 2>nul
    if errorlevel 1 python -m venv "%PROJECT_DIR%venv"
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
)

if not exist "%PYTHON_EXE%" (
    echo [ERROR] No se encontro %PYTHON_EXE%.
    pause
    exit /b 1
)

echo Instalando/actualizando dependencias del backend...
"%PYTHON_EXE%" -m pip install -r "%PROJECT_DIR%requirements.txt"
if errorlevel 1 (
    echo [ERROR] Fallo la instalacion de requirements.txt.
    pause
    exit /b 1
)

echo.
echo Verificando Apache...
netstat -ano | findstr /R /C:":80 .*LISTENING" >nul 2>nul
if errorlevel 1 (
    if exist "C:\xampp\apache_start.bat" (
        echo Iniciando Apache desde XAMPP...
        start "Apache XAMPP" /min "C:\xampp\apache_start.bat"
        timeout /t 5 /nobreak >nul
    ) else (
        echo [AVISO] No se encontro C:\xampp\apache_start.bat.
    )
) else (
    echo Apache o un servicio web ya esta escuchando en el puerto 80.
)

echo.
echo Verificando MySQL...
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>nul
if errorlevel 1 (
    if exist "C:\xampp\mysql_start.bat" (
        echo Iniciando MySQL desde XAMPP...
        start "MySQL XAMPP" /min "C:\xampp\mysql_start.bat"
        timeout /t 8 /nobreak >nul
    ) else (
        echo [AVISO] No se encontro C:\xampp\mysql_start.bat.
        echo Si el backend falla, abre XAMPP e inicia MySQL manualmente.
    )
) else (
    echo MySQL ya esta en ejecucion.
)

echo.
echo Verificando backend Django en puerto %BACKEND_PORT%...
netstat -ano | findstr /R /C:":%BACKEND_PORT% .*LISTENING" >nul 2>nul
if errorlevel 1 (
    echo Iniciando backend Django...
    start "Backend Django" /D "%PROJECT_DIR%" cmd /k ""%PYTHON_EXE%" manage.py runserver 0.0.0.0:%BACKEND_PORT%"
) else (
    echo Backend ya esta en ejecucion.
)

echo.
echo Verificando dependencias del frontend...
if not exist "%PROJECT_DIR%frontend\node_modules" (
    echo Instalando dependencias de frontend...
    pushd "%PROJECT_DIR%frontend"
    call npm.cmd install
    if errorlevel 1 (
        popd
        echo [ERROR] Fallo npm install.
        pause
        exit /b 1
    )
    popd
)

echo.
echo Verificando frontend Vite en puerto %FRONTEND_PORT%...
netstat -ano | findstr /R /C:":%FRONTEND_PORT% .*LISTENING" >nul 2>nul
if errorlevel 1 (
    echo Iniciando frontend Vite...
    start "Frontend Vite" /D "%PROJECT_DIR%frontend" cmd /k npm.cmd run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%
) else (
    echo Frontend ya esta en ejecucion.
)

echo.
echo Abriendo navegador...
timeout /t 3 /nobreak >nul
start "" "%FRONTEND_URL%"

echo.
echo Listo. La aplicacion deberia abrir en:
echo %FRONTEND_URL%
echo.
pause
