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
        echo ERROR: Docker Desktop not installed
        pause
        exit /b 1
    )
)
echo OK
echo.

echo [2/4] Starting Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    set RETRY=0
    :docker_wait
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if errorlevel 1 (
        set /a RETRY+=1
        if !RETRY! LEQ 24 (
            echo   Waiting... (!RETRY!/24)
            goto :docker_wait
        ) else (
            echo ERROR: Docker failed to start
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

docker run -d --name intelliquiz_frontend --network intelliquiz_network -e VITE_API_BASE_URL=http://localhost:8090 -p 3000:3000 --restart always intelliquiz-frontend:latest

echo OK
echo.

echo [4/4] Opening browser...
timeout /t 10 /nobreak >nul
start http://localhost:3000

echo.
echo IntelliQuiz is running!
echo.
timeout /t 3
exit