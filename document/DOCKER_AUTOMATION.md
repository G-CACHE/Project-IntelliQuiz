# Docker Automation Guide

Automatically rebuild Docker containers after `git pull` with new changes.

## Quick Start

```bash
# Install the Git hook (one-time setup)
python docker_automation.py --install-hook

# That's it! Now every git pull with changes will auto-rebuild
git pull
```

## How It Works

1. When you run `git pull` and new changes are merged
2. The Git post-merge hook triggers automatically
3. The script checks which files changed
4. If backend/Docker files changed → stops, rebuilds, and restarts containers
5. If only frontend/docs changed → skips rebuild (no action needed)

## Commands

| Command | Description |
|---------|-------------|
| `python docker_automation.py` | Auto mode - rebuild containers |
| `python docker_automation.py --rebuild` | Force stop, rebuild, start |
| `python docker_automation.py --stop` | Stop all containers |
| `python docker_automation.py --force` | Force rebuild even if no changes |
| `python docker_automation.py --logs` | Show logs after starting |
| `python docker_automation.py --install-hook` | Install Git hook |
| `python docker_automation.py --uninstall-hook` | Remove Git hook |

## Skip Rebuild

To temporarily skip the auto-rebuild:

```bash
# Set environment variable before git pull
set SKIP_DOCKER_REBUILD=1
git pull
```

## What Triggers a Rebuild?

**Rebuild triggers:**
- `backend/**` - Any backend source changes
- `Dockerfile` - Docker configuration
- `docker-compose.yml` - Compose configuration
- `pom.xml` - Maven dependencies

**Skip (no rebuild):**
- `frontend/**` - Frontend changes
- `*.md` - Documentation
- `document/**` - Documentation folder
- `script/**` - Utility scripts

## Service URLs

After rebuild completes:
- API: http://localhost:8090
- Health: http://localhost:8090/actuator/health
- Swagger: http://localhost:8090/swagger-ui.html
- Database: localhost:5434 (postgres/mysecretpassword)

## Logs

View automation logs:
```bash
# Log file location
type docker_automation.log

# Docker container logs
docker-compose logs -f
```
