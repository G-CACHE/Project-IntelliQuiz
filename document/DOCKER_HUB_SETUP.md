# Team Setup Guide - Docker Hub

## For Your Team Members

Your IntelliQuiz backend is now on Docker Hub! Your team members can pull and run it with a single command.

### Prerequisites

1. **Install Docker Desktop** - https://www.docker.com/products/docker-desktop
2. **Clone the repository** - with this updated `docker-compose.prod.yml` and `run_docker_prod.py` files

### Quick Start (One Command)

```bash
python run_docker_prod.py
```

That's it! ✨

The script will:
- ✓ Check Docker is installed and running
- ✓ Pull the latest backend image from Docker Hub (`gm1026/intelliquiz-backend:latest`)
- ✓ Pull PostgreSQL image
- ✓ Start both containers
- ✓ Wait for services to be ready
- ✓ Display connection details

### What Gets Started

**PostgreSQL Database:**
- Host: `localhost`
- Port: `5434`
- Username: `postgres`
- Password: `mysecretpassword`
- Database: `intelliquiz`

**Spring Boot Backend API:**
- URL: `http://localhost:8090`
- Health Check: `http://localhost:8090/actuator/health`
- Swagger UI: `http://localhost:8090/swagger-ui.html` (if configured)

### Common Tasks

**Check database tables:**
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d intelliquiz -c "\dt"
```

**View backend logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

**View database logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f db
```

**Stop all containers:**
```bash
docker-compose -f docker-compose.prod.yml down
```

**Stop and remove database data:**
```bash
docker-compose -f docker-compose.prod.yml down -v
```

**Restart containers:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Testing the Backend

**From command line:**
```bash
curl http://localhost:8090/actuator/health
```

**From browser:**
- Visit: http://localhost:8090/actuator/health
- Should show: `{"status":"UP"}`

### Troubleshooting

**"Docker daemon is not running"**
- Start Docker Desktop and wait 30 seconds

**"Connection refused on port 8090"**
- Backend might still be starting, wait 10-15 seconds
- Check logs: `docker-compose -f docker-compose.prod.yml logs backend`

**"psql: command not found"**
- Use Docker to run psql:
  ```bash
  docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d intelliquiz -c "\dt"
  ```

**"No tables found in database"**
- This is normal! Tables are created when the backend first connects
- Wait a few more seconds and try again

### Docker Hub Image Details

- **Image Name:** `gm1026/intelliquiz-backend:latest`
- **Repository:** https://hub.docker.com/r/gm1026/intelliquiz-backend
- **Auto-updates:** Pull the latest version anytime with:
  ```bash
  docker pull gm1026/intelliquiz-backend:latest
  ```

### Files in This Repository

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production config (pulls from Docker Hub) |
| `run_docker_prod.py` | Team setup script (handles everything) |
| `docker-compose.yml` | Development config (builds locally) |
| `setup_and_run_docker.py` | Development setup script |
| `CHECK_DATABASE.md` | Database checking guide |

### For Frontend Developers

Use `run_docker_prod.py` to start the backend, then:

1. Clone the frontend repo
2. Install dependencies: `npm install`
3. Create `.env.development.local`:
   ```
   VITE_API_BASE_URL=http://localhost:8090
   ```
4. Start dev server: `npm run dev`
5. Visit: `http://localhost:5173`

### Need Help?

Check the logs for more details:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

Or check individual service logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f db
```
