@echo off
REM ============================================
REM IntelliQuiz Docker Compose Builder
REM Builds and runs both backend and database
REM ============================================

setlocal enabledelayedexpansion

cls
echo.
echo ===============================================
echo   IntelliQuiz Docker Compose Builder
echo ===============================================
echo.

REM Check if Docker is installed
echo [1] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo X Docker is not installed
    echo.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    exit /b 1
) else (
    for /f "tokens=*" %%A in ('docker --version') do (
        echo + %%A
    )
)

REM Check if Docker daemon is running
echo [2] Checking Docker daemon...
docker ps >nul 2>&1
if errorlevel 1 (
    echo X Docker daemon is not running
    echo Please start Docker Desktop
    exit /b 1
) else (
    echo + Docker daemon is running
)

REM Navigate to project root
echo [3] Locating project root...
cd /d "%~dp0.."
if exist "docker-compose.yml" (
    echo + Project root found
) else (
    echo X docker-compose.yml not found
    exit /b 1
)

REM Check if docker-compose.yml exists
echo [4] Checking docker-compose.yml...
if not exist "docker-compose.yml" (
    echo X docker-compose.yml not found
    exit /b 1
) else (
    echo + docker-compose.yml found
)

REM Build and start containers
echo.
echo [5] Building and starting containers...
echo     Building backend image...
echo     Starting PostgreSQL (port 5434)...
echo     Starting Backend (port 8090)...
echo.

docker-compose up --build -d

if errorlevel 1 (
    echo X Failed to start containers
    docker-compose logs
    exit /b 1
) else (
    echo.
    echo ===============================================
    echo   Services are running!
    echo ===============================================
    echo.
    echo PostgreSQL Database:
    echo   Host:     localhost
    echo   Port:     5434
    echo   User:     postgres
    echo   Password: mysecretpassword
    echo   Database: intelliquiz
    echo.
    echo Spring Boot Backend:
    echo   URL:      http://localhost:8090
    echo   Swagger:  http://localhost:8090/swagger-ui.html (if configured)
    echo   Health:   http://localhost:8090/actuator/health
    echo.
    echo Useful Commands:
    echo   View logs:              docker-compose logs -f
    echo   View backend logs:      docker-compose logs -f backend
    echo   View database logs:     docker-compose logs -f db
    echo   Stop containers:        docker-compose down
    echo   Stop and remove volumes: docker-compose down -v
    echo.
    echo Waiting for services to be ready...
    timeout /t 10 /nobreak
    
    echo.
    echo Checking service health...
    
    REM Check database
    echo   Database: Checking...
    docker-compose exec -T db pg_isready -U postgres >nul 2>&1
    if errorlevel 1 (
        echo   Database: Starting...
    ) else (
        echo   Database: Ready
    )
    
    REM Check backend
    echo   Backend: Checking...
    timeout /t 3 /nobreak >nul
    
    echo.
    echo Backend is compiling and starting. This may take a few moments...
    echo Monitor progress with: docker-compose logs -f backend
)
