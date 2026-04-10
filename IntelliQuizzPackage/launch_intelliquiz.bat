@echo off
setlocal enabledelayedexpansion
color 0A
cls

echo.
echo ============================================================
echo   IntelliQuiz - Starting Application  
echo ============================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/4] Checking Docker Desktop...
where docker.exe >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
    ) else (
        echo Docker Desktop not found. Installing automatically...
        echo.
        echo This will take 5-10 minutes. Please wait...
        echo.
        
        REM Run Docker installation script
        powershell.exe -ExecutionPolicy Bypass -NoProfile -File "C:\IntelliQuiz\scripts\install_docker.ps1"
        
        if errorlevel 1 (
            echo.
            echo ERROR: Docker Desktop installation failed
            echo.
            echo Please try:
            echo   1. Restart your computer and run IntelliQuiz again
            echo   2. Install Docker Desktop manually from:
            echo      https://www.docker.com/products/docker-desktop
            echo.
            pause
            exit /b 1
        )
        
        echo.
        echo Docker Desktop installed successfully!
        echo.
        
        REM Update PATH for current session
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
    )
)
echo OK
echo.

echo [2/4] Starting Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo   Docker not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo   Waiting for Docker engine to start (this may take 2-3 minutes)...
    set RETRY=0
    :docker_wait
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if errorlevel 1 (
        set /a RETRY+=1
        if !RETRY! LEQ 60 (
            if !RETRY! EQU 12 echo   Still starting... (1 minute elapsed)
            if !RETRY! EQU 24 echo   Still starting... (2 minutes elapsed)
            if !RETRY! EQU 36 echo   Still starting... (3 minutes elapsed)
            goto :docker_wait
        ) else (
            echo.
            echo ERROR: Docker engine did not start within 5 minutes
            echo.
            echo Docker Desktop UI is open but the engine is still initializing.
            echo This is normal on first installation.
            echo.
            echo Please wait 2 more minutes, then run IntelliQuiz again.
            echo.
            pause
            exit /b 1
        )
    )
)
echo OK
echo.

echo [3/4] Loading and starting containers...
cd /d C:\IntelliQuiz

docker network create intelliquiz_network 2>nul
docker volume create postgres_data 2>nul
docker volume create intelliquiz_backups 2>nul

docker load -i "images\intelliquiz-db.tar.gz" 2>nul
docker load -i "images\intelliquiz-backend.tar.gz" 2>nul
docker load -i "images\intelliquiz-frontend.tar.gz" 2>nul

docker images localhost/intelliquiz-frontend:latest -q 2>nul | findstr . >nul
if not errorlevel 1 (
    docker tag localhost/intelliquiz-frontend:latest intelliquiz-frontend:latest
)

docker stop intelliquiz_db intelliquiz_backend intelliquiz_frontend 2>nul
docker rm intelliquiz_db intelliquiz_backend intelliquiz_frontend 2>nul

docker run -d --name intelliquiz_db --network intelliquiz_network --network-alias db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=intelliquiz -e TZ=Asia/Manila -p 5434:5432 -v postgres_data:/var/lib/postgresql/data --restart always danielvictorioso/intelliquiz-db:latest

timeout /t 5 /nobreak >nul

docker run -d --name intelliquiz_backend --network intelliquiz_network --network-alias backend -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/intelliquiz -e SPRING_DATASOURCE_USERNAME=postgres -e SPRING_DATASOURCE_PASSWORD=mysecretpassword -e SPRING_JPA_HIBERNATE_DDL_AUTO=update -e SPRING_PROFILES_ACTIVE=docker -e SERVER_PORT=8082 -e SSL_ENABLED=false -e DISABLE_DOTENV=true -e TZ=Asia/Manila -p 8090:8082 -v intelliquiz_backups:/app/backups --restart always danielvictorioso/intelliquiz-backend:latest

timeout /t 3 /nobreak >nul

docker run -d --name intelliquiz_frontend --network intelliquiz_network -p 3000:3000 --restart always intelliquiz-frontend:latest

echo OK
echo.

echo [4/4] Getting server information...
timeout /t 5 /nobreak >nul

REM Get server IP using ipconfig (skip Docker and localhost IPs)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set IP_RAW=%%a
    for /f "tokens=* delims= " %%b in ("!IP_RAW!") do set TEMP_IP=%%b
    REM Skip localhost, Docker (172.17-172.31), and link-local (169.254)
    echo !TEMP_IP! | findstr /R "^127\. ^172\.1[7-9]\. ^172\.2[0-9]\. ^172\.3[0-1]\. ^169\.254\." >nul
    if errorlevel 1 (
        set SERVER_IP=!TEMP_IP!
        goto :ip_found
    )
)
:ip_found

start http://localhost:3000

cls
echo.
echo ============================================================
echo   IntelliQuiz is Running!
echo ============================================================
echo.
echo   SERVER ACCESS (on this machine):
echo   http://localhost:3000
echo.
echo   PARTICIPANT ACCESS (from other devices):
if defined SERVER_IP (
    echo   http://!SERVER_IP!:3000
    echo.
    echo   SHARE THIS LINK WITH PARTICIPANTS:
    echo   http://!SERVER_IP!:3000
) else (
    echo   Run 'ipconfig' to find your IP address
    echo   Then share: http://[YOUR_IP]:3000
)
echo.
echo   Note: Participants must be on the same network/LAN
echo.
echo ============================================================
echo.
echo   Press any key to close this window...
echo   IntelliQuiz will continue running in the background.
echo.
pause >nul
exit
