# IntelliQuiz Installer - Developer Documentation

## Overview

This document explains how the IntelliQuiz installer works, the architecture, and everything you need to know about the system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Installer Components](#installer-components)
3. [How the Installer Works](#how-the-installer-works)
4. [How the Launcher Works](#how-the-launcher-works)
5. [Docker Architecture](#docker-architecture)
6. [Network Configuration](#network-configuration)
7. [Build Process](#build-process)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

IntelliQuiz uses a containerized architecture with Docker:

```
┌─────────────────────────────────────────────────────────────┐
│                    IntelliQuiz System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Frontend   │  │   Backend    │  │   Database   │    │
│  │   (React)    │  │  (Spring)    │  │ (PostgreSQL) │    │
│  │   Port 3000  │  │  Port 8090   │  │  Port 5434   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                 │                  │             │
│         └─────────────────┴──────────────────┘             │
│                    Docker Network                          │
│              (intelliquiz_network)                         │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Frontend Container** - React + Vite + Nginx
2. **Backend Container** - Spring Boot REST API
3. **Database Container** - PostgreSQL with pre-loaded data

---

## Installer Components

### File Structure

```
IntelliQuizzPackage/
├── IntelliQuizzInstaller.iss      # Inno Setup configuration
├── launch_intelliquiz.bat         # Main launcher script
├── docker-compose.prod.yml        # Docker Compose config
├── images/
│   ├── intelliquiz-frontend.tar.gz  # Frontend Docker image
│   ├── intelliquiz-backend.tar.gz   # Backend Docker image
│   └── intelliquiz-db.tar.gz        # Database Docker image
├── scripts/
│   ├── setup.ps1                  # Setup utilities
│   ├── cleanup.ps1                # Cleanup utilities
│   ├── install_docker.ps1         # Docker installation
│   ├── load_images.ps1            # Image loading
│   └── check_requirements.ps1     # System checks
├── README.txt                     # User documentation
├── ACCESS_INFO.txt                # Participant access guide
├── LAN_ACCESS_GUIDE.txt           # Technical LAN guide
├── TROUBLESHOOTING.txt            # Troubleshooting guide
└── LICENSE.txt                    # License information
```

### Key Files Explained

**IntelliQuizzInstaller.iss**
- Inno Setup script that creates the .exe installer
- Defines what files to include
- Sets installation directory (C:\IntelliQuiz)
- Creates desktop shortcut
- Handles file compression (LZMA2 ultra compression)

**launch_intelliquiz.bat**
- Main launcher that users run
- Checks Docker Desktop
- Loads Docker images
- Starts containers
- Detects and displays server IP
- Opens browser automatically

**Docker Images (.tar.gz)**
- Pre-built Docker images bundled with installer
- Compressed for smaller file size
- Loaded offline (no internet needed)


---

## How the Installer Works

### Installation Process

1. **User runs IntelliQuizzInstaller.exe**
   - Requests administrator privileges
   - Shows license agreement
   - Shows pre-installation info

2. **File Extraction**
   - Extracts to C:\IntelliQuiz
   - Creates directory structure
   - Copies all files (launcher, images, scripts, docs)

3. **Desktop Shortcut Creation**
   - Creates "IntelliQuiz" shortcut on desktop
   - Points to: C:\IntelliQuiz\launch_intelliquiz.bat

4. **Post-Installation**
   - Shows completion message with access instructions
   - User can now run IntelliQuiz from desktop shortcut

### What Gets Installed

```
C:\IntelliQuiz/
├── launch_intelliquiz.bat         # Main launcher
├── docker-compose.prod.yml        # Docker config
├── images/
│   ├── intelliquiz-frontend.tar.gz  (~25 MB)
│   ├── intelliquiz-backend.tar.gz   (~125 MB)
│   └── intelliquiz-db.tar.gz        (~102 MB)
├── data/                          # Created on first run
│   ├── postgres/                  # Database data
│   ├── backups/                   # Backup files
│   └── logs/                      # Log files
├── README.txt
├── ACCESS_INFO.txt
├── LAN_ACCESS_GUIDE.txt
├── TROUBLESHOOTING.txt
└── LICENSE.txt
```

### Installer Size

- Total uncompressed: ~250 MB
- Compressed installer: ~150-180 MB (LZMA2 ultra compression)


---

## How the Launcher Works

### Launcher Flow (launch_intelliquiz.bat)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Check Administrator Privileges                     │
│ - Requests admin if not already running as admin           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Check Docker Desktop                               │
│ - Verifies docker.exe exists                               │
│ - Adds Docker to PATH if needed                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Start Docker Desktop                               │
│ - Checks if Docker is running (docker info)                │
│ - Starts Docker Desktop if not running                     │
│ - Waits up to 2 minutes for Docker to be ready             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Load Docker Images                                 │
│ - Creates Docker network (intelliquiz_network)             │
│ - Creates Docker volumes (postgres_data, backups)          │
│ - Loads images from .tar.gz files                          │
│ - Handles localhost/ prefix retagging for frontend         │
│ - Stops and removes old containers                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Start Containers                                   │
│ - Starts database container (port 5434)                    │
│ - Waits 5 seconds for DB to initialize                     │
│ - Starts backend container (port 8090)                     │
│ - Waits 3 seconds for backend to start                     │
│ - Starts frontend container (port 3000)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Detect Server IP                                   │
│ - Runs ipconfig to find IPv4 addresses                     │
│ - Filters out localhost (127.x.x.x)                        │
│ - Filters out Docker networks (172.17-31.x.x)              │
│ - Filters out link-local (169.254.x.x)                     │
│ - Displays actual WiFi/LAN IP                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Display Access Information                         │
│ - Shows server access URL (localhost:3000)                 │
│ - Shows participant access URL (detected IP:3000)          │
│ - Opens browser to localhost:3000                          │
│ - Waits for user to close window                           │
└─────────────────────────────────────────────────────────────┘
```


### Launcher Code Breakdown

**Administrator Check**
```batch
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
```
- Uses `net session` to check admin privileges
- Relaunches itself with admin rights if needed

**Docker Desktop Check**
```batch
where docker.exe >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
    )
)
```
- Checks if docker.exe is in PATH
- Adds Docker to PATH if installed but not in PATH

**IP Detection**
```batch
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set IP_RAW=%%a
    for /f "tokens=* delims= " %%b in ("!IP_RAW!") do set TEMP_IP=%%b
    echo !TEMP_IP! | findstr /R "^127\. ^172\.1[7-9]\. ^172\.2[0-9]\. ^172\.3[0-1]\. ^169\.254\." >nul
    if errorlevel 1 (
        set SERVER_IP=!TEMP_IP!
        goto :ip_found
    )
)
```
- Parses ipconfig output
- Filters out unwanted IPs (localhost, Docker, link-local)
- Finds actual WiFi/LAN IP

**Container Startup**
```batch
docker run -d --name intelliquiz_frontend --network intelliquiz_network -p 3000:3000 --restart always intelliquiz-frontend:latest
```
- `-d` = detached mode (runs in background)
- `--name` = container name
- `--network` = connects to Docker network
- `-p 3000:3000` = port mapping (host:container)
- `--restart always` = auto-restart on failure


---

## Docker Architecture

### Container Details

**Frontend Container (intelliquiz-frontend:latest)**
- Base: nginx:alpine
- Build: Multi-stage (Node.js build → Nginx runtime)
- Port: 3000
- Purpose: Serves React app, proxies API calls to backend
- Size: ~25 MB compressed

**Backend Container (danielvictorioso/intelliquiz-backend:latest)**
- Base: Java 17
- Framework: Spring Boot
- Port: 8082 (mapped to 8090 on host)
- Purpose: REST API, business logic
- Size: ~125 MB compressed

**Database Container (danielvictorioso/intelliquiz-db:latest)**
- Base: PostgreSQL 16
- Port: 5432 (mapped to 5434 on host)
- Purpose: Data storage
- Size: ~102 MB compressed
- Includes: Pre-loaded quiz data

### Docker Network

```
intelliquiz_network (bridge)
├── intelliquiz_frontend (alias: frontend)
├── intelliquiz_backend (alias: backend)
└── intelliquiz_db (alias: db)
```

**Internal Communication:**
- Frontend → Backend: `http://backend:8082`
- Backend → Database: `jdbc:postgresql://db:5432/intelliquiz`

**External Access:**
- Frontend: `http://[SERVER_IP]:3000`
- Backend: `http://[SERVER_IP]:8090`
- Database: `[SERVER_IP]:5434`

### Docker Volumes

**postgres_data**
- Stores PostgreSQL database files
- Persists data between container restarts
- Location: Docker managed volume

**intelliquiz_backups**
- Stores database backup files
- Accessible from backend container
- Location: Docker managed volume


---

## Network Configuration

### LAN Access Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Network Topology                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Server PC (192.168.1.41)                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Docker Containers                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Frontend │  │ Backend  │  │ Database │          │  │
│  │  │  :3000   │  │  :8090   │  │  :5434   │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │       ↑              ↑              ↑                │  │
│  │       └──────────────┴──────────────┘                │  │
│  │         Bound to 0.0.0.0 (all interfaces)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│                   Network Interface                         │
│                   (192.168.1.41)                           │
│                          ↓                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Router / Switch                          │
│                    (192.168.1.1)                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Participant Devices                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PC/Laptop   │  │    Phone     │  │    Tablet    │    │
│  │ 192.168.1.50 │  │ 192.168.1.58 │  │ 192.168.1.60 │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         ↓                 ↓                  ↓             │
│  Access: http://192.168.1.41:3000                         │
└─────────────────────────────────────────────────────────────┘
```

### Port Bindings

**Why 0.0.0.0?**
- `0.0.0.0:3000` means "listen on ALL network interfaces"
- Allows access from localhost AND LAN
- Without it, only localhost would work

**Port Mapping:**
```
Host Port → Container Port
3000      → 3000 (Frontend)
8090      → 8082 (Backend)
5434      → 5432 (Database)
```

### Frontend API Proxy

The frontend uses nginx to proxy API calls:

```nginx
location /api/ {
    proxy_pass http://backend:8082/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**Why?**
- Frontend uses relative URLs (`/api/...`)
- Works from any IP (localhost or LAN)
- No hardcoded backend URL
- Avoids CORS issues


---

## Build Process

### Building the Installer

**Prerequisites:**
- Inno Setup 6 installed
- Docker Desktop running
- All Docker images built

**Step 1: Build Frontend Image**
```powershell
cd frontend/intelliquiz-frontend
docker build -t intelliquiz-frontend:latest .
cd ../..
```

**Step 2: Export Docker Images**
```powershell
cd IntelliQuizzPackage
docker save intelliquiz-frontend:latest -o images/intelliquiz-frontend.tar
# Note: PowerShell can't create .gz, so we rename .tar to .tar.gz
Move-Item images/intelliquiz-frontend.tar images/intelliquiz-frontend.tar.gz
cd ..
```

**Step 3: Build Installer**
```powershell
# Open in Inno Setup Compiler
& "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" IntelliQuizzPackage/IntelliQuizzInstaller.iss

# Or press F9 in Inno Setup Compiler GUI
```

**Output:**
- `IntelliQuizzPackage/output/IntelliQuizzInstaller.exe`

### Automated Build Script

Use `rebuild_for_lan.ps1`:
```powershell
.\rebuild_for_lan.ps1
```

This script:
1. Rebuilds frontend image
2. Exports all images
3. Builds installer
4. Shows summary

### Image Export Details

**Why .tar.gz?**
- Docker images are large (250+ MB uncompressed)
- .tar.gz reduces size by ~30-40%
- Faster distribution

**Note on Compression:**
- PowerShell's `Compress-Archive` only creates .zip
- We use .tar files renamed to .tar.gz
- Docker can load both .tar and .tar.gz
- Inno Setup compresses everything again with LZMA2


---

## Troubleshooting

### Common Issues During Development

**Issue: Frontend image has localhost/ prefix**
```
Solution: Launcher automatically detects and retags
docker images localhost/intelliquiz-frontend:latest -q | findstr . >nul
if not errorlevel 1 (
    docker tag localhost/intelliquiz-frontend:latest intelliquiz-frontend:latest
)
```

**Issue: Containers not accessible from LAN**
```
Cause: Not binding to 0.0.0.0
Solution: Use -p 0.0.0.0:3000:3000 instead of -p 3000:3000
```

**Issue: IP detection shows Docker IP (172.x.x.x)**
```
Cause: Docker network IP detected first
Solution: Filter out Docker IPs in launcher
echo !TEMP_IP! | findstr /R "^172\.1[7-9]\. ^172\.2[0-9]\. ^172\.3[0-1]\." >nul
```

**Issue: Installer too large**
```
Solution: Use LZMA2 ultra compression in Inno Setup
Compression=lzma2/ultra64
SolidCompression=yes
```

### Testing the Installer

**Test on Fresh Machine:**
1. Remove all Docker images: `docker rmi -f $(docker images -q)`
2. Remove all containers: `docker rm -f $(docker ps -aq)`
3. Run installer
4. Verify all 3 containers start
5. Test access from another device

**Test LAN Access:**
1. Connect two devices to same network
2. Run IntelliQuiz on one device
3. Note the IP shown by launcher
4. Access from second device
5. Should see IntelliQuiz login page

**Test with Hotspot:**
1. Enable mobile hotspot on phone
2. Connect PC to hotspot
3. Run IntelliQuiz
4. Access from phone's browser
5. Should work without issues


---

## Advanced Topics

### Modifying the Installer

**Add New Files:**
1. Add file to IntelliQuizzPackage folder
2. Edit IntelliQuizzInstaller.iss:
```iss
[Files]
Source: "your_file.txt"; DestDir: "{app}"; Flags: ignoreversion
```
3. Rebuild installer

**Change Installation Directory:**
```iss
[Setup]
DefaultDirName=C:\YourPath
```

**Add Post-Install Script:**
```iss
[Run]
Filename: "powershell.exe"; Parameters: "-File ""{app}\your_script.ps1"""; Flags: runhidden
```

### Updating Docker Images

**Update Frontend:**
1. Make changes to frontend code
2. Rebuild image: `docker build -t intelliquiz-frontend:latest .`
3. Export: `docker save intelliquiz-frontend:latest -o images/intelliquiz-frontend.tar`
4. Rename to .tar.gz
5. Rebuild installer

**Update Backend:**
1. Build new backend JAR
2. Build Docker image
3. Tag as: `danielvictorioso/intelliquiz-backend:latest`
4. Export and update installer

### Environment Variables

**Frontend (.env.production):**
```
VITE_API_BASE_URL=
```
- Empty = uses relative URLs
- Works from any IP

**Backend (in launcher):**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/intelliquiz
SPRING_PROFILES_ACTIVE=docker
SERVER_PORT=8082
SSL_ENABLED=false
```

### Security Considerations

**Network Security:**
- System designed for trusted intranet use
- No HTTPS (use reverse proxy if needed)
- No authentication at network level
- Application-level auth required (login)

**Firewall:**
- Port 3000 must be open for LAN access
- Launcher doesn't auto-configure firewall
- Users may need to add firewall rule manually

**Data Persistence:**
- Database data persists in Docker volume
- Survives container restarts
- Lost if volume is deleted


---

## Deployment Scenarios

### Scenario 1: Computer Lab (Wired)

**Setup:**
- 1 server PC with IntelliQuiz
- 30 client PCs
- All connected via Ethernet switch

**Process:**
1. Install IntelliQuiz on server PC
2. Run launcher
3. Note IP (e.g., 10.243.101.147)
4. Write IP on whiteboard
5. Students access: http://10.243.101.147:3000

**Advantages:**
- No AP isolation issues
- Stable connection
- Fast speeds
- Recommended setup

### Scenario 2: Classroom (WiFi)

**Setup:**
- 1 teacher laptop with IntelliQuiz
- 25 student devices (phones/tablets/laptops)
- School WiFi network

**Process:**
1. Install IntelliQuiz on teacher laptop
2. Connect to school WiFi
3. Run launcher
4. Share IP with students
5. Students connect to same WiFi
6. Access IntelliQuiz

**Considerations:**
- Check if AP isolation is disabled
- May need IT admin help
- Test before class

### Scenario 3: Home/Small Office (Hotspot)

**Setup:**
- 1 PC with IntelliQuiz
- 5-10 participants
- Mobile hotspot

**Process:**
1. Enable hotspot on phone
2. Connect PC to hotspot
3. Run IntelliQuiz
4. Participants connect to same hotspot
5. Access IntelliQuiz

**Advantages:**
- No router configuration needed
- Works anywhere
- Good for small groups

**Limitations:**
- Uses mobile data
- Limited to hotspot range
- May be slower than WiFi

---

## Maintenance

### Updating IntelliQuiz

**Minor Updates (Bug Fixes):**
1. Update source code
2. Rebuild Docker images
3. Export images
4. Rebuild installer
5. Distribute new installer

**Major Updates (New Features):**
1. Update all components
2. Test thoroughly
3. Update documentation
4. Rebuild installer
5. Provide migration guide if needed

### Backup and Restore

**Backup Database:**
```powershell
docker exec intelliquiz_db pg_dump -U postgres intelliquiz > backup.sql
```

**Restore Database:**
```powershell
docker exec -i intelliquiz_db psql -U postgres intelliquiz < backup.sql
```

**Backup Volumes:**
```powershell
docker run --rm -v postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Monitoring

**Check Container Status:**
```powershell
docker ps
```

**View Logs:**
```powershell
docker logs intelliquiz_frontend
docker logs intelliquiz_backend
docker logs intelliquiz_db
```

**Check Resource Usage:**
```powershell
docker stats
```

---

## Summary

The IntelliQuiz installer is a self-contained, offline-capable package that:

✅ Bundles all Docker images
✅ Installs with one click
✅ Configures LAN access automatically
✅ Detects and displays server IP
✅ Works on wired and wireless networks
✅ Includes comprehensive documentation
✅ Handles common issues automatically

**Key Technologies:**
- Docker (containerization)
- Inno Setup (installer creation)
- Batch scripting (launcher)
- Nginx (frontend proxy)
- Spring Boot (backend)
- PostgreSQL (database)

**Target Environment:**
- Windows 10/11
- Intranet/LAN deployment
- Computer labs, classrooms, offices
- No internet required for operation

---

## Contact & Support

For issues or questions:
1. Check TROUBLESHOOTING.txt
2. Review this documentation
3. Check Docker logs
4. Verify network configuration

---

*Last Updated: 2026-04-09*
*Version: 1.0.0*
