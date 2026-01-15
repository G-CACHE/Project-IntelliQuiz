# Frontend Developer Guide - Local Backend Setup

This guide helps frontend developers quickly set up and run the backend API and database locally.

## Quick Start (One Command)

```bash
python run_docker.py
```

That's it! Your backend API will be running at **http://localhost:8090**

## What This Does

When you run the script, it will:
1. ✓ Check Docker is installed and running
2. ✓ Pull the latest code from git
3. ✓ Build and start the backend (Spring Boot)
4. ✓ Start the database (PostgreSQL)
5. ✓ Show you the API endpoint and credentials

## Prerequisites

- **Docker Desktop** installed and running
- Git configured on your machine

## Usage

### Start Services (Recommended)
```bash
python run_docker.py
```

### Start and Watch Logs
```bash
python run_docker.py --logs
```

### Restart Services
```bash
python run_docker.py --restart
```

### Stop Services
```bash
python run_docker.py --stop
```

## Backend API Details

Once running, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| API Base | http://localhost:8090 | Your backend API |
| Health Check | http://localhost:8090/actuator/health | Check if API is running |
| Swagger UI | http://localhost:8090/swagger-ui.html | Interactive API documentation |

## Example API Call

```bash
# Test the health endpoint
curl http://localhost:8090/actuator/health

# Expected response:
# {"status":"UP","components":{...}}
```

## Frontend Environment Configuration

Update your frontend's environment to point to:

```javascript
// Example: React/Vue/Angular
const API_BASE_URL = "http://localhost:8090"

// or use environment variable
VITE_API_URL=http://localhost:8090
REACT_APP_API_URL=http://localhost:8090
```

## Database Access (If Needed)

If you need to access the database directly:

```bash
# Using psql
psql -h localhost -p 5434 -U postgres -d intelliquiz

# Password: mysecretpassword
```

## Useful Docker Commands

```bash
# View real-time logs
docker-compose logs -f

# View only backend logs
docker-compose logs -f backend

# View container status
docker-compose ps

# Stop containers (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart without rebuilding
docker-compose restart
```

## Troubleshooting

### "Docker is not running"
- Open Docker Desktop application
- Wait 30 seconds for Docker daemon to start
- Run the script again

### "Port 8090 is already in use"
```bash
# Find what's using the port
lsof -i :8090        # macOS/Linux
netstat -ano | findstr :8090  # Windows

# Then stop that service and try again
```

### "Network error when pulling code"
- Check your internet connection
- Run script again (it will continue without pulling if network fails)
- Or manually: `git pull` then `python run_docker.py`

### "Containers won't start"
```bash
# Check Docker space/resources
docker system df

# Clean up if needed
docker system prune -a

# Try again
python run_docker.py
```

## First Run (Takes Longer)

The first time you run this script:
- ⏳ Takes 10-20 minutes (downloads Java, Maven, dependencies)
- 🔄 Subsequent runs take 30 seconds - 2 minutes

This is normal! The next time will be much faster due to caching.

## Starting Frontend Development

1. Run: `python run_docker.py`
2. Wait for "Services are Running!" message
3. Update your frontend config to use `http://localhost:8090`
4. Start your frontend development server
5. Test API calls to `http://localhost:8090/your-endpoint`

## Stopping Services

When you're done developing:

```bash
python run_docker.py --stop
```

Or simply:
```bash
docker-compose down
```

## Need More Details?

See [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md) for comprehensive documentation.

## Quick Reference

| Task | Command |
|------|---------|
| Start | `python run_docker.py` |
| Start with logs | `python run_docker.py --logs` |
| Restart | `python run_docker.py --restart` |
| Stop | `python run_docker.py --stop` |
| View logs | `docker-compose logs -f` |
| Check status | `docker-compose ps` |
| Clean up | `docker system prune -a` |

## API Endpoints to Test

Once the backend is running, you can test these endpoints:

```bash
# Health check (always works)
curl http://localhost:8090/actuator/health

# If Swagger is configured:
# Visit http://localhost:8090/swagger-ui.html in your browser

# Your custom endpoints (replace with actual endpoints)
# GET http://localhost:8090/api/users
# GET http://localhost:8090/api/events
```

---

**Happy coding!** 🚀

For backend setup or issues, contact your backend team lead.
