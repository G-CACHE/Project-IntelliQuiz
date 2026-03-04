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

⚠️ **SECURITY WARNING**: Never commit this file to git! It contains sensitive credentials.

```properties
# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/intelliquiz
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=YOUR_DB_PASSWORD_HERE

# Server Configuration
SERVER_PORT=8090
SSL_ENABLED=false

# JWT Secret - MUST be changed for production!
# Generate with: openssl rand -base64 32
JWT_SECRET=GENERATE_YOUR_OWN_SECRET_HERE

# Database Backup Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=intelliquiz
DB_USERNAME=postgres
DB_PASSWORD=YOUR_DB_PASSWORD_HERE
BACKUP_DIR=./backups
```

**How to generate secrets**:
```bash
# Generate JWT Secret
openssl rand -base64 32

# Or using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
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

### Database Initialization Process

The database initialization is a critical part of the setup process. Understanding how it works helps troubleshoot issues when they arise.

#### How Database Initialization Works

When you run `docker compose up` or `python run_docker_prod.py`, the following happens:

1. **Docker Image Build/Pull**
   - The database Docker image is built or pulled from Docker Hub
   - The image includes the PostgreSQL database engine and initialization scripts

2. **Container Startup**
   - PostgreSQL container starts and initializes the database
   - The `database/Dockerfile` copies the backup file to `/docker-entrypoint-initdb.d/`

3. **Backup File Loading**
   - PostgreSQL automatically runs any `.sql` files in `/docker-entrypoint-initdb.d/`
   - The `backup_intelliquiz.sql` file is executed
   - This creates all tables, indexes, and loads any pre-existing data

4. **Initialization Complete**
   - Database is ready to accept connections
   - All tables and schema are in place

#### Database Files and Scripts

**Key Files**:
- `database/Dockerfile` - Defines the database container image
- `database/backup_intelliquiz.sql` - PostgreSQL dump containing schema and data
- `database/init-db.sh` - Optional initialization script (for advanced setup)

**Dockerfile Role**:
```dockerfile
FROM postgres:18-alpine

# Copy the backup SQL file into the initialization directory
COPY backup_intelliquiz.sql /docker-entrypoint-initdb.d/

# Set proper permissions
RUN chmod 644 /docker-entrypoint-initdb.d/backup_intelliquiz.sql
```

The Dockerfile ensures the backup file is available when PostgreSQL starts.

#### Verifying Database Initialization

After starting the containers, verify the database initialized correctly:

```bash
# Run the verification script
python verify_db_setup.py
```

This script checks:
- ✓ Database container is running
- ✓ Database is accessible
- ✓ All required tables exist
- ✓ game_session table is present
- ✓ Data is present in tables
- ✓ Backup was loaded successfully

**Expected Output**:
```
✓ Database container is running
✓ Database is accessible
✓ User accounts (user): X rows
✓ Quiz content (quiz): X rows
✓ Quiz questions (question): X rows
✓ Teams (team): X rows
✓ Game sessions (game_session): X rows
✓ Backup loaded successfully (8 tables found)
```

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

**For Local Development**:
- **Host**: `localhost`
- **Port**: `5434` (external) / `5432` (internal to Docker)
- **Database**: `intelliquiz`
- **Username**: `postgres`
- **Password**: Set in your `backend/.env` file

⚠️ **SECURITY NOTE**: The default Docker Compose setup uses a development password. Change this for production deployments!

### Creating a Superadmin User

```sql
-- Connect to database first
docker exec -it intelliquiz_db psql -U postgres -d intelliquiz

-- Create superadmin account with BCrypt hashed password
INSERT INTO "user" (id, username, password, system_role, deleted) 
VALUES (
  nextval('user_id_seq'),
  'superadmin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'SUPER_ADMIN',
  false
);
```

**Default Credentials** (for development only):
- Username: `superadmin`
- Password: `password`

⚠️ **SECURITY WARNING**: Change this password immediately after first login in production!

**To generate your own BCrypt hash**:
```bash
# Using Python
python -c "import bcrypt; print(bcrypt.hashpw(b'your_password', bcrypt.gensalt()).decode())"
```

### Updating User Password

```sql
-- Update existing user password (use your own BCrypt hash)
UPDATE "user" 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'superadmin';
```

**Note**: The hash above is for the password `password`. Generate your own hash for security.

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

#### Regenerating the Backup File

If the backup file becomes corrupted or needs to be updated with new data:

1. **Create a fresh backup from running database**:
   ```bash
   # Ensure database is running
   docker compose up -d db
   
   # Wait for database to be ready
   sleep 10
   
   # Create backup
   docker exec intelliquiz_db pg_dump -U postgres intelliquiz > database/backup_intelliquiz.sql
   ```

2. **Verify the backup file**:
   ```bash
   # Check file size (should be > 1KB)
   ls -lh database/backup_intelliquiz.sql
   
   # Check first few lines (should have valid headers)
   head -20 database/backup_intelliquiz.sql
   ```

3. **Test the backup file**:
   ```bash
   # Run backup validity test
   python database/test_backup_validity.py
   ```

4. **Rebuild Docker image with new backup**:
   ```bash
   # Rebuild database image
   docker build -t intelliquiz-db:latest database/
   
   # Tag for Docker Hub (if pushing)
   docker tag intelliquiz-db:latest gm1026/intelliquiz-db:latest
   
   # Push to Docker Hub
   docker push gm1026/intelliquiz-db:latest
   ```

5. **Update docker-compose.prod.yml** (if needed):
   ```yaml
   db:
     image: gm1026/intelliquiz-db:latest  # Updated image
   ```

6. **Verify with team**:
   ```bash
   # Team members can now pull the updated image
   python run_docker_prod.py
   ```

**Important**: After regenerating the backup file, notify your team to pull the latest Docker image.

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

### Database Initialization Issues

#### Issue: Database Tables Are Missing

**Symptoms**:
- `verify_db_setup.py` reports missing tables
- Error: "Some tables are missing!"
- Tables like `game_session` are not found

**Root Causes**:
1. Backup file is corrupted or incomplete
2. PostgreSQL initialization didn't complete
3. Backup file wasn't copied to container properly

**Solutions**:

1. **Check database logs**:
   ```bash
   docker compose logs db | tail -50
   ```
   Look for SQL errors or initialization failures.

2. **Verify backup file integrity**:
   ```bash
   # Check if backup file exists and is valid
   python database/test_backup_validity.py
   ```

3. **Restart with fresh database**:
   ```bash
   # Stop and remove containers (keeps data in volumes)
   docker compose down
   
   # Remove volumes to start fresh
   docker compose down -v
   
   # Start again
   docker compose up
   ```

4. **Check backup file manually**:
   ```bash
   # View first 50 lines of backup file
   head -50 database/backup_intelliquiz.sql
   
   # Should start with valid PostgreSQL dump headers:
   -- PostgreSQL database dump
   -- Dumped from database version 16.11
   ```

#### Issue: Database Connection Refused

**Symptoms**:
- Error: "could not connect to server"
- Error: "Connection refused"
- `verify_db_setup.py` fails at connectivity check

**Solutions**:

1. **Check if database container is running**:
   ```bash
   docker ps | grep intelliquiz_db
   ```

2. **Check database logs**:
   ```bash
   docker logs intelliquiz_db
   ```

3. **Wait for initialization**:
   - PostgreSQL can take 10-15 seconds to initialize
   - Run `verify_db_setup.py` again after waiting

4. **Restart database**:
   ```bash
   docker compose restart db
   ```

5. **Check port availability**:
   ```bash
   # Windows
   netstat -ano | findstr :5434
   
   # Linux/Mac
   lsof -i :5434
   ```

#### Issue: Backup File Not Loading

**Symptoms**:
- Database starts but tables are empty
- No data in tables
- Backup file seems to be ignored

**Solutions**:

1. **Verify backup file is in correct location**:
   ```bash
   ls -la database/backup_intelliquiz.sql
   ```

2. **Check Docker image includes backup file**:
   ```bash
   # Inspect the database image
   docker inspect gm1026/intelliquiz-db:latest
   ```

3. **Manually load backup file**:
   ```bash
   # Connect to database and load backup
   docker exec -i intelliquiz_db psql -U postgres -d intelliquiz < database/backup_intelliquiz.sql
   ```

4. **Verify backup file syntax**:
   ```bash
   # Check for SQL syntax errors
   psql -U postgres -d intelliquiz -f database/backup_intelliquiz.sql
   ```

#### Issue: Verification Script Fails

**Symptoms**:
- `verify_db_setup.py` reports errors
- Script can't connect to database
- Row counts are incorrect

**Solutions**:

1. **Run with verbose output**:
   ```bash
   python verify_db_setup.py 2>&1 | tee verify_output.log
   ```

2. **Check database manually**:
   ```bash
   # Connect to database
   docker exec -it intelliquiz_db psql -U postgres -d intelliquiz
   
   # List tables
   \dt
   
   # Check row counts
   SELECT COUNT(*) FROM "user";
   SELECT COUNT(*) FROM quiz;
   ```

3. **Verify docker-compose.prod.yml configuration**:
   ```bash
   # Check if file exists
   ls -la docker-compose.prod.yml
   
   # Verify database service configuration
   grep -A 10 "db:" docker-compose.prod.yml
   ```

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

---

## Security Best Practices

### Environment Variables and Secrets

⚠️ **CRITICAL**: Never commit `.env` files or secrets to git!

#### Protected Files (Never Commit)
- `backend/.env` - Contains JWT secrets and database passwords
- `frontend/intelliquiz-frontend/.env` - Contains API endpoints
- `.env.local.json` - Contains database credentials
- Any file with actual passwords, API keys, or tokens

#### Safe to Commit
- `.env.example` - Template files with placeholder values
- `docker-compose.yml` - Development configuration with default passwords
- Documentation with `YOUR_SECRET_HERE` placeholders

### Secret Management Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] No real secrets in documentation
- [ ] Production uses unique, strong secrets
- [ ] JWT secrets are randomly generated (32+ bytes)
- [ ] Database passwords are strong (16+ characters)
- [ ] Secrets are rotated regularly
- [ ] Team members don't share secrets via chat/email

### Generating Secure Secrets

```bash
# Generate JWT Secret (32 bytes, base64 encoded)
openssl rand -base64 32

# Generate Strong Password (16 bytes)
openssl rand -base64 16

# Generate BCrypt Hash for User Password
python -c "import bcrypt; print(bcrypt.hashpw(b'your_password', bcrypt.gensalt()).decode())"
```

### Production Deployment Security

1. **Change ALL default passwords**
   - Database passwords
   - Admin user passwords
   - JWT secrets

2. **Use environment variables**
   - Never hardcode secrets in code
   - Use platform-specific secret management (AWS Secrets Manager, Azure Key Vault, etc.)

3. **Enable HTTPS/TLS**
   - Set `SSL_ENABLED=true` in production
   - Use valid SSL certificates (not self-signed)

4. **Restrict database access**
   - Don't expose database port publicly
   - Use firewall rules
   - Enable SSL for database connections

5. **Regular security audits**
   - Review access logs
   - Update dependencies
   - Rotate secrets periodically

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
