# IntelliQuiz Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Running the Application](#running-the-application)
6. [Database Management](#database-management)
7. [Development Workflows](#development-workflows)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Useful Commands Reference](#useful-commands-reference)

---

## Project Overview

IntelliQuiz is a quiz management platform built with:
- **Backend**: Spring Boot 3.2.5 (Java 21) with Spring Modulith architecture
- **Frontend**: React 19 with TypeScript, Vite, and TailwindCSS
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Docker Desktop** (latest version)
  - Download: https://www.docker.com/products/docker-desktop
- **Node.js** (v18 or higher) and npm
  - Download: https://nodejs.org/
- **Java 21** (for local backend development)
  - Download: https://adoptium.net/
- **Maven 3.9+** (for local backend development)
  - Download: https://maven.apache.org/download.cgi
- **Git** (for version control)
  - Download: https://git-scm.com/

### Optional Tools
- **PostgreSQL Client** (psql) - for direct database access
- **Postman** or **Insomnia** - for API testing

---

## Project Structure

```
Project-IntelliQuiz/
├── backend/                    # Spring Boot backend
│   ├── src/
│   │   ├── main/java/         # Application source code
│   │   └── test/java/         # Test files
│   ├── pom.xml                # Maven dependencies
│   ├── Dockerfile             # Backend Docker image
│   └── .env                   # Backend environment variables
├── frontend/
│   └── intelliquiz-frontend/  # React frontend
│       ├── src/               # Frontend source code
│       ├── package.json       # npm dependencies
│       └── .env               # Frontend environment variables
├── database/                  # Database scripts and backups
├── docker-compose.yml         # Development Docker setup
├── docker-compose.prod.yml    # Production Docker setup
└── DEVELOPER_GUIDE.md         # This file
```

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Project-IntelliQuiz
```

### 2. Configure Environment Variables

#### Backend Configuration (`backend/.env`)
```properties
# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/intelliquiz
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=mysecretpassword

# Server Configuration
SERVER_PORT=8090
SSL_ENABLED=false

# JWT Secret (generate your own for production)
JWT_SECRET=zvjnKxyRnopy0pOSNceHHKO1BUn1r/968YbNaFmaVBg=

# Database Backup Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=intelliquiz
DB_USERNAME=postgres
DB_PASSWORD=mysecretpassword
BACKUP_DIR=./backups
```

#### Frontend Configuration (`frontend/intelliquiz-frontend/.env`)
```properties
VITE_API_BASE_URL=http://localhost:8090
```

---

## Running the Application

### Option 1: Using Docker Compose (Recommended)

This is the easiest way to run the entire application stack.

#### Start All Services

```bash
# Build and start all containers (database + backend)
docker compose up --build

# Or run in detached mode (background)
docker compose up --build -d
```

**What this does:**
- Builds the backend Docker image
- Starts PostgreSQL database on port `5434`
- Starts Spring Boot backend on port `8090`
- Creates necessary Docker volumes for data persistence

#### Stop All Services

```bash
# Stop containers (keeps data)
docker compose stop

# Stop and remove containers (keeps data in volumes)
docker compose down

# Stop, remove containers AND delete all data
docker compose down -v
```

#### View Logs

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs db

# Follow logs in real-time
docker compose logs -f backend
```

### Option 2: Running Services Individually

#### Start Database Only

```bash
docker compose up db
```

#### Run Backend Locally (without Docker)

```bash
cd backend

# Using Maven wrapper
./mvnw spring-boot:run

# Or using Maven directly
mvn spring-boot:run
```

**Note**: Make sure `backend/.env` points to `localhost:5434` for the database.

#### Run Frontend Locally

```bash
cd frontend/intelliquiz-frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The frontend will be available at `https://localhost:5174`

---

## Database Management

### Accessing the Database

#### Using Docker Exec (Recommended)

```bash
# Connect to PostgreSQL inside the container
docker exec -it intelliquiz_db psql -U postgres -d intelliquiz
```

#### Common psql Commands

Once inside psql:

```sql
-- List all databases
\l

-- List all tables
\dt

-- Describe a table structure
\d table_name

-- View table data
SELECT * FROM "user";

-- Quit psql
\q
```

### Database Credentials

- **Host**: `localhost`
- **Port**: `5434` (external) / `5432` (internal to Docker)
- **Database**: `intelliquiz`
- **Username**: `postgres`
- **Password**: `mysecretpassword`

### Creating a Superadmin User

```sql
-- Connect to database first
docker exec -it intelliquiz_db psql -U postgres -d intelliquiz

-- Create superadmin account
INSERT INTO "user" (id, username, password, system_role, deleted) 
VALUES (
  nextval('user_id_seq'),
  'superadmin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'SUPER_ADMIN',
  false
);
```

**Default Credentials:**
- Username: `superadmin`
- Password: `password`

### Updating User Password

```sql
-- Update existing user password
UPDATE "user" 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'superadmin';
```

### Database Backup and Restore

#### Create Backup

```bash
# Backup from running container
docker exec intelliquiz_db pg_dump -U postgres intelliquiz > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restore Backup

```bash
# Restore to running container
docker exec -i intelliquiz_db psql -U postgres -d intelliquiz < backup_file.sql
```

---

## Development Workflows

### Backend Development

#### Build the Backend

```bash
cd backend

# Clean and build
./mvnw clean package

# Skip tests for faster build
./mvnw clean package -DskipTests
```

#### Run Tests

```bash
cd backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=AuthenticationServiceTest

# Run property-based tests only
./mvnw test -Dtest=*PropertyTest
```

#### Access API Documentation

Once the backend is running, access Swagger UI:

```
http://localhost:8090/swagger-ui/index.html
```

### Frontend Development

#### Install Dependencies

```bash
cd frontend/intelliquiz-frontend
npm install
```

#### Development Server

```bash
# Start dev server with hot reload
npm run dev
```

#### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

#### Run Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

#### Linting

```bash
# Check for linting errors
npm run lint
```

---

## Testing

### Backend Testing

The backend uses **jqwik** for property-based testing and **JUnit** for unit tests.

```bash
cd backend

# Run all tests
./mvnw test

# Run only unit tests
./mvnw test -Dtest=*Test

# Run only property-based tests
./mvnw test -Dtest=*PropertyTest

# Run with coverage
./mvnw test jacoco:report
```

### Frontend Testing

The frontend uses **Vitest** and **fast-check** for property-based testing.

```bash
cd frontend/intelliquiz-frontend

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Docker Container Name Conflict

**Error**: `The container name "/intelliquiz_db" is already in use`

**Solution**:
```bash
# Stop and remove the conflicting container
docker stop intelliquiz_db
docker rm intelliquiz_db

# Or remove all stopped containers
docker container prune
```

#### 2. Port Already in Use

**Error**: `Bind for 0.0.0.0:5434 failed: port is already allocated`

**Solution**:
```bash
# Find process using the port (Windows)
netstat -ano | findstr :5434

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
```

#### 3. Backend SSL Protocol Error

**Error**: `net::ERR_SSL_PROTOCOL_ERROR`

**Solution**: Ensure SSL is disabled in `backend/.env`:
```properties
SSL_ENABLED=false
```

And frontend points to HTTP:
```properties
VITE_API_BASE_URL=http://localhost:8090
```

#### 4. Database Connection Failed

**Error**: `Connection refused` or `could not connect to server`

**Solution**:
```bash
# Check if database container is running
docker ps | findstr intelliquiz_db

# Check database logs
docker logs intelliquiz_db

# Restart database
docker compose restart db
```

#### 5. Frontend Certificate Error (OpenSSL)

**Error**: `'openssl' is not recognized as an internal or external command`

**Solution**: The frontend dev server tries to generate SSL certificates. Either:
- Install Git for Windows (includes OpenSSL)
- Or modify `package.json` to remove certificate generation:
  ```json
  "dev": "vite"
  ```

#### 6. Maven Build Fails

**Error**: Build failures or dependency issues

**Solution**:
```bash
cd backend

# Clean Maven cache and rebuild
./mvnw clean install -U

# Or delete .m2 cache and rebuild
rm -rf ~/.m2/repository
./mvnw clean install
```

---

## Useful Commands Reference

### Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs <container_name>
docker logs -f <container_name>  # Follow logs

# Execute command in container
docker exec -it <container_name> <command>

# Stop container
docker stop <container_name>

# Remove container
docker rm <container_name>

# Remove all stopped containers
docker container prune

# View images
docker images

# Remove image
docker rmi <image_name>

# Remove unused images
docker image prune
```

### Docker Compose Commands

```bash
# Start services
docker compose up
docker compose up -d              # Detached mode
docker compose up --build         # Rebuild images

# Stop services
docker compose stop               # Stop containers
docker compose down               # Stop and remove containers
docker compose down -v            # Also remove volumes

# View logs
docker compose logs
docker compose logs -f            # Follow logs
docker compose logs backend       # Specific service

# Restart services
docker compose restart
docker compose restart backend    # Specific service

# View running services
docker compose ps

# Execute command in service
docker compose exec backend sh
docker compose exec db psql -U postgres
```

### Database Commands

```bash
# Connect to database
docker exec -it intelliquiz_db psql -U postgres -d intelliquiz

# Run SQL file
docker exec -i intelliquiz_db psql -U postgres -d intelliquiz < script.sql

# Backup database
docker exec intelliquiz_db pg_dump -U postgres intelliquiz > backup.sql

# Restore database
docker exec -i intelliquiz_db psql -U postgres -d intelliquiz < backup.sql

# View database tables
docker exec intelliquiz_db psql -U postgres -d intelliquiz -c "\dt"

# View specific table
docker exec intelliquiz_db psql -U postgres -d intelliquiz -c "SELECT * FROM \"user\";"
```

### Maven Commands (Backend)

```bash
cd backend

# Clean and build
./mvnw clean package

# Run application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Skip tests
./mvnw clean package -DskipTests

# Run specific test
./mvnw test -Dtest=TestClassName

# Generate test coverage report
./mvnw test jacoco:report
```

### NPM Commands (Frontend)

```bash
cd frontend/intelliquiz-frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
npm run test:watch

# Lint code
npm run lint

# Update dependencies
npm update
```

---

## Production Deployment

### Using Production Docker Compose

```bash
# Start production stack (uses pre-built images from Docker Hub)
docker compose -f docker-compose.prod.yml up -d

# Stop production stack
docker compose -f docker-compose.prod.yml down
```

### Building and Pushing to Docker Hub

```bash
# Build backend image
cd backend
docker build -t your-dockerhub-username/intelliquiz-backend:latest .

# Push to Docker Hub
docker push your-dockerhub-username/intelliquiz-backend:latest
```

---

## Automation Scripts

The project includes several Python automation scripts to simplify Docker operations and deployment workflows.

### Prerequisites for Scripts

```bash
# Python 3.7+ required
python --version

# No additional dependencies needed (uses standard library)
```

### Available Scripts

#### 1. `run_docker.py` - Quick Backend Setup for Frontend Developers

**Purpose**: Simplified script for frontend developers to quickly start backend and database.

**Usage**:
```bash
# Start backend and database
python run_docker.py

# Start and show logs
python run_docker.py --logs

# Restart containers
python run_docker.py --restart

# Stop containers
python run_docker.py --stop
```

**What it does**:
- Checks Docker installation
- Pulls latest code from git
- Builds and starts backend (port 8090) and database (port 5434)
- Displays connection details

**Best for**: Frontend developers who just need the backend API running.

---

#### 2. `run_docker_prod.py` - Production Setup from Docker Hub

**Purpose**: Pull and run pre-built images from Docker Hub (no local building required).

**Usage**:
```bash
python run_docker_prod.py
```

**What it does**:
- Checks Docker installation
- Pulls latest images from Docker Hub (`gm1026/intelliquiz-backend:latest`)
- Starts containers using `docker-compose.prod.yml`
- Waits for services to be ready
- Displays connection information

**Best for**: Team members who want to run the latest production build without building locally.

---

#### 3. `setup_and_run_docker.py` - Full Development Setup

**Purpose**: Complete Docker Compose setup with all checks and options.

**Usage**:
```bash
# Full setup and run
python setup_and_run_docker.py

# Pull latest code first
python setup_and_run_docker.py --pull

# Show logs after startup
python setup_and_run_docker.py --logs

# Don't rebuild images (use cached)
python setup_and_run_docker.py --no-build

# Stop all containers
python setup_and_run_docker.py --stop
```

**What it does**:
- Comprehensive Docker and Docker Compose checks
- Optional git pull
- Builds backend Docker image
- Starts all services
- Health checks for database and backend
- Displays detailed service information

**Best for**: Full development setup with all validation steps.

---

#### 4. `docker_automation.py` - Automated Rebuild on Git Pull

**Purpose**: Automatically rebuild Docker containers when backend code changes are pulled from git.

**Usage**:
```bash
# Manual rebuild
python docker_automation.py --rebuild

# Stop containers
python docker_automation.py --stop

# Force rebuild (ignore file checks)
python docker_automation.py --force

# Show logs after rebuild
python docker_automation.py --logs

# Install git hook for automatic rebuilds
python docker_automation.py --install-hook

# Remove git hook
python docker_automation.py --uninstall-hook
```

**What it does**:
- Detects changes in backend files after `git pull`
- Automatically rebuilds containers if backend/Docker files changed
- Skips rebuild if only frontend/docs changed
- Can be triggered manually or via git post-merge hook

**Smart Detection**:
- **Triggers rebuild** for: `backend/**`, `Dockerfile`, `docker-compose.yml`, `pom.xml`
- **Skips rebuild** for: `frontend/**`, `*.md`, `document/**`, `script/**`

**Git Hook Installation**:
```bash
# Install the hook (runs automatically after git pull)
python docker_automation.py --install-hook

# Now every git pull will check if rebuild is needed
git pull
```

**Environment Variable Override**:
```bash
# Skip rebuild even if changes detected
SKIP_DOCKER_REBUILD=1 git pull
```

**Best for**: Developers who want automatic container rebuilds after pulling backend changes.

---

#### 5. `push_to_docker_hub.py` - Publish to Docker Hub

**Purpose**: Build and push the backend image to Docker Hub for team distribution.

**Usage**:
```bash
python push_to_docker_hub.py
```

**What it does**:
- Checks if local image exists
- Logs into Docker Hub (prompts for credentials)
- Tags image as `gm1026/intelliquiz-backend:latest`
- Pushes to Docker Hub
- Provides pull command for team members

**Prerequisites**:
- Docker Hub account
- Local backend image built (`docker compose build backend`)
- Docker Hub credentials

**Best for**: Maintainers publishing new backend versions for the team.

---

#### 6. `test_docker_automation.py` - Property-Based Tests

**Purpose**: Test suite for docker automation pattern matching logic.

**Usage**:
```bash
# Install pytest and hypothesis (first time only)
pip install pytest hypothesis

# Run tests
pytest test_docker_automation.py -v

# Run with coverage
pytest test_docker_automation.py --cov=docker_automation
```

**What it tests**:
- Pattern matching for rebuild triggers
- Skip pattern exclusivity
- Environment variable overrides
- Force flag behavior

**Best for**: Developers modifying automation scripts or verifying behavior.

---

### Quick Reference Table

| Script | Use Case | Build Required | Internet Required |
|--------|----------|----------------|-------------------|
| `run_docker.py` | Frontend dev quick start | Yes | Yes (git pull) |
| `run_docker_prod.py` | Run production images | No | Yes (Docker Hub) |
| `setup_and_run_docker.py` | Full dev setup | Yes | Optional |
| `docker_automation.py` | Auto-rebuild on pull | Yes | Optional |
| `push_to_docker_hub.py` | Publish to Docker Hub | Yes | Yes (Docker Hub) |
| `test_docker_automation.py` | Test automation | No | No |

---

## Additional Resources

- **Spring Boot Documentation**: https://spring.io/projects/spring-boot
- **React Documentation**: https://react.dev/
- **Docker Documentation**: https://docs.docker.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs: `docker compose logs`
3. Contact the development team

---

**Last Updated**: March 2026
**Version**: 1.0.0
