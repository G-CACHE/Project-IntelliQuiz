# Docker Compose Setup Guide - IntelliQuiz

This guide explains how to build and run the entire IntelliQuiz application (Backend + Database) using Docker Compose.

## Quick Start

### Windows
```bash
database\run_docker_compose.bat
```

### macOS / Linux
```bash
bash database/run_postgres_container.sh
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│             Docker Network: intelliquiz_network      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐│
│  │  Spring Boot Backend │  │  PostgreSQL Database ││
│  │  Port: 8090          │  │  Port: 5434          ││
│  │  Container: backend  │  │  Container: db       ││
│  │  URL: localhost:8090 │  │  Host: db:5432       ││
│  │                      │  │  (internal network)  ││
│  └──────────────────────┘  └──────────────────────┘│
│           ↓                          ↑              │
│     Connects to (SPRING_DATASOURCE_URL)            │
│     jdbc:postgresql://db:5432/intelliquiz          │
└─────────────────────────────────────────────────────┘
```

## What Happens When You Run Docker Compose

1. **Build Phase**
   - ✓ Reads `docker-compose.yml`
   - ✓ Builds Spring Boot backend from `Dockerfile.backend`
   - ✓ Maven compiles the project with `mvn clean package`
   - ✓ Creates Docker image for backend

2. **Start Phase**
   - ✓ Starts PostgreSQL container on port 5434
   - ✓ Waits for PostgreSQL to be healthy
   - ✓ Starts Spring Boot backend container on port 8090
   - ✓ Spring Boot connects to database

3. **Auto Schema Creation**
   - ✓ Spring Boot reads entity classes from code
   - ✓ Hibernate auto-generates tables based on `@Entity` classes
   - ✓ Tables created in PostgreSQL automatically
   - ✓ Configuration: `spring.jpa.hibernate.ddl-auto=update`

## File Structure

```
project-cache-in/
├── docker-compose.yml              # Main compose configuration
├── Dockerfile.backend              # Backend build instructions
├── backend/                        # Spring Boot application
│   ├── pom.xml
│   ├── src/
│   └── mvnw
├── database/
│   ├── run_postgres_container.sh   # Linux/macOS runner
│   └── run_docker_compose.bat      # Windows runner
└── ...
```

## Prerequisites

### Docker Desktop
Download and install from: https://www.docker.com/products/docker-desktop

**Minimum Requirements:**
- 4GB RAM (8GB recommended)
- 10GB free disk space
- CPU with virtualization support

### Verify Installation
```bash
docker --version
docker-compose --version
docker run hello-world
```

## Configuration

### Database Settings
- **Container Name:** intelliquiz_db
- **Image:** postgres:18-alpine
- **Port:** 5434 → 5432
- **User:** postgres
- **Password:** mysecretpassword
- **Database:** intelliquiz

### Backend Settings
- **Container Name:** intelliquiz_backend
- **Port:** 8090 → 8080
- **Database URL:** jdbc:postgresql://db:5432/intelliquiz
- **Username:** postgres
- **Password:** mysecretpassword
- **DDL Auto:** update (auto-create tables)

### Spring Boot Environment Variables
These are automatically set in docker-compose.yml:
```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/intelliquiz
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=mysecretpassword
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_PROFILES_ACTIVE=docker
```

## Running the Application

### Start Services
```bash
# Windows
database\run_docker_compose.bat

# macOS/Linux
bash database/run_postgres_container.sh
```

### View Logs
```bash
# All services
docker-compose logs -f

# Only backend
docker-compose logs -f backend

# Only database
docker-compose logs -f db
```

### Stop Services
```bash
# Gracefully stop (keeps data)
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

### Access Services

**Backend API:**
- Main URL: http://localhost:8090
- Health Check: http://localhost:8090/actuator/health
- Swagger UI: http://localhost:8090/swagger-ui.html (if configured)

**Database (psql):**
```bash
# From host machine
psql -h localhost -p 5434 -U postgres -d intelliquiz

# Or from inside container
docker-compose exec db psql -U postgres -d intelliquiz
```

## Verify Tables Were Created

### Using psql
```bash
docker-compose exec db psql -U postgres -d intelliquiz -c "\dt"
```

### Using SQL Query
```bash
docker-compose exec db psql -U postgres -d intelliquiz << EOF
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
EOF
```

### Expected Tables (from Spring Boot Entities)
The exact tables depend on your `@Entity` classes, but will include:
- user
- role
- permission
- role_permission
- user_role
- quiz_event
- team
- question
- question_choice
- submission
- event_winner

## Troubleshooting

### Port Already in Use

**Port 5434 in use:**
```bash
# Find what's using the port
lsof -i :5434        # macOS/Linux
netstat -ano | findstr :5434  # Windows

# Change port in docker-compose.yml
# From: "5434:5432"
# To:   "5435:5432"
```

**Port 8090 in use:**
```bash
# Find what's using the port
lsof -i :8090        # macOS/Linux
netstat -ano | findstr :8090  # Windows

# Change port in docker-compose.yml
# From: "8090:8080"
# To:   "8091:8080"
```

### Docker Daemon Not Running

**Windows:**
- Open Docker Desktop application

**macOS:**
```bash
open /Applications/Docker.app
```

**Linux:**
```bash
sudo systemctl start docker
```

### Backend Takes Long Time to Start

First build can take 5-10 minutes because Maven downloads dependencies. Subsequent builds are faster.

### Out of Memory

**Increase Docker memory:**
- Docker Desktop → Settings → Resources
- Set Memory to 6-8GB

### Database Connection Refused

Wait 30 seconds for database to be fully ready before backend connects.

Check database health:
```bash
docker-compose ps
```

The `db` container should show `(healthy)` status.

### No Tables Created

1. Check if backend started successfully:
   ```bash
   docker-compose logs backend | grep -i error
   ```

2. Verify database connection in Spring Boot logs:
   ```bash
   docker-compose logs backend | grep -i datasource
   ```

3. Check if `SPRING_JPA_HIBERNATE_DDL_AUTO=update` is set:
   ```bash
   docker-compose config | grep DDL
   ```

## Advanced Usage

### Rebuild Images
```bash
docker-compose build --no-cache
```

### Run with Custom Environment
```bash
docker-compose up -e SPRING_PROFILES_ACTIVE=production -d
```

### Access Backend Container Shell
```bash
docker-compose exec backend /bin/sh
```

### Access Database Container Shell
```bash
docker-compose exec db /bin/sh
```

### Monitor Resource Usage
```bash
docker stats
```

### View Network Information
```bash
docker network ls
docker inspect intelliquiz_network
```

## Performance Tips

### First Time Setup
- First build takes 5-10 minutes (Maven downloads ~500MB)
- Subsequent builds are much faster due to caching

### Reduce Build Time
```bash
# Clean up unused Docker resources
docker system prune

# Remove old images/containers
docker image prune
docker container prune
```

### Improve Backend Startup
The `Dockerfile.backend` uses Alpine Linux which is lightweight:
- Smaller image size (~300MB)
- Faster startup
- Lower memory usage

## Modifying Configuration

### Change Database Password
Edit `docker-compose.yml`:
```yaml
environment:
  POSTGRES_PASSWORD: mynewpassword
```

Then update Spring Boot password:
```yaml
SPRING_DATASOURCE_PASSWORD: mynewpassword
```

### Change Ports
Edit `docker-compose.yml`:
```yaml
# Database
ports:
  - "5435:5432"  # Changed from 5434

# Backend
ports:
  - "8091:8080"  # Changed from 8090
```

### Enable Hibernate SQL Logging
Edit `application.properties` in backend:
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
```

## Comparing Approaches

### Without Docker (Local Development)
- ✓ Faster iteration
- ✗ Manual setup required
- ✗ Environment differences
- Use: `python run_backend.py` and `psql`

### With Docker (Production-like)
- ✓ Consistent environment
- ✓ Easy distribution
- ✓ Automatic setup
- ✗ Slightly slower
- Use: `docker-compose up`

## Next Steps

1. **Backend Customization**
   - Add your Spring Boot endpoints
   - Configure properties in `application-docker.properties`
   - Define your JPA entities

2. **Database Schema**
   - Spring Boot will auto-create tables
   - Or manually add DDL files for seed data

3. **Frontend Integration**
   - Configure backend URL in frontend to `http://localhost:8090`
   - Test API connections

4. **Production Deployment**
   - Use smaller Java image
   - Add environment-specific configs
   - Consider using Kubernetes

## Support

**Common Issues:**
- https://docs.docker.com/compose/troubleshooting/
- https://spring.io/guides/gs/spring-boot-docker/

**Docker Documentation:**
- https://docs.docker.com/
- https://docs.docker.com/compose/

**Spring Boot Documentation:**
- https://spring.io/projects/spring-boot
- https://spring.io/guides/gs/accessing-data-jpa/

Happy coding! 🚀
