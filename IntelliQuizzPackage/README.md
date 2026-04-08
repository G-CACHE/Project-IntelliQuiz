# IntelliQuiz Production Package

This directory contains all files needed to build the production installer.

## Directory Structure

```
IntelliQuizzPackage/
├── images/                          # Docker images as .tar files
│   ├── intelliquiz-backend.tar
│   ├── intelliquiz-db.tar
│   └── intelliquiz-frontend.tar
├── scripts/                         # PowerShell automation scripts
│   ├── run.ps1                      # Main launcher (runs containers)
│   ├── setup.ps1                    # First-time setup (init Podman, create task)
│   └── cleanup.ps1                  # Cleanup/uninstall script
├── docs/                            # Documentation
│   ├── INSTALL_INFO.txt             # User installation guide
│   ├── LICENSE.txt                  # License
│   └── README.md                    # Project README
├── docker-compose.prod.yml          # Production compose config
└── IntelliQuizzInstaller.iss        # Inno Setup configuration
```

## Prerequisites for Building

### 1. Install Inno Setup (on your development machine)
```
Download from: https://jrsoftware.org/isdl.php
Install the latest version (6.x+)
```

### 2. Build Docker Images

#### Frontend Image
```bash
cd frontend/intelliquiz-frontend
docker build -t intelliquiz-frontend:latest .
docker save -o ../../IntelliQuizzPackage/images/intelliquiz-frontend.tar intelliquiz-frontend:latest
```

#### Backend & Database (if not using Docker Hub)
```bash
# If using Docker Hub images, download them:
docker pull danielvictorioso/intelliquiz-backend:latest
docker save -o IntelliQuizzPackage/images/intelliquiz-backend.tar danielvictorioso/intelliquiz-backend:latest

docker pull danielvictorioso/intelliquiz-db:latest
docker save -o IntelliQuizzPackage/images/intelliquiz-db.tar danielvictorioso/intelliquiz-db:latest
```

### 3. Prepare Package Contents

Copy these files to IntelliQuizzPackage/scripts/:
- `run.ps1`
- `setup.ps1`
- `cleanup.ps1`

Copy to IntelliQuizzPackage/:
- `docker-compose.prod.yml`
- `README.md`
- `LICENSE.txt`
- `INSTALL_INFO.txt`

Copy to IntelliQuizzPackage/docs/:
- Any additional documentation

### 4. Verify Package Structure

```
IntelliQuizzPackage/
├── images/
│   ├── intelliquiz-frontend.tar         ✓ ~100-200MB
│   ├── intelliquiz-backend.tar          ✓ ~200-300MB
│   └── intelliquiz-db.tar               ✓ ~300-400MB
├── scripts/
│   ├── run.ps1                          ✓
│   ├── setup.ps1                        ✓
│   └── cleanup.ps1                      ✓
├── docs/
│   ├── INSTALL_INFO.txt                 ✓
│   ├── LICENSE.txt                      ✓
│   └── README.md                        ✓
├── docker-compose.prod.yml              ✓
└── IntelliQuizzInstaller.iss            ✓
```

## Building the Installer

### Using Inno Setup GUI (Recommended)
1. Open Inno Setup Compiler
2. File → Open Script
3. Select: `IntelliQuizzPackage/IntelliQuizzInstaller.iss`
4. Click "Compile"
5. Output created: `output/IntelliQuizzInstaller.exe`

### Using Command Line
```powershell
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" ` 
  "C:\Project-IntelliQuiz\IntelliQuizzPackage\IntelliQuizzInstaller.iss"
```

## Testing the Installer

### 1. On Your Development Machine
```powershell
# Run as Administrator
Start-Process -FilePath ".\output\IntelliQuizzInstaller.exe" -Verb RunAs
```

### 2. On a Clean Virtual Machine (RECOMMENDED)
- Use VirtualBox/Hyper-V to create a clean Windows 10/11 VM
- Delete snapshots to ensure clean state
- Run installer from there
- Verify:
  - ✓ Podman installs silently
  - ✓ App opens in browser
  - ✓ Can login and use app
  - ✓ Data saves correctly
  - ✓ Reboot test: app auto-starts
  - ✓ Data persists after reboot

### 3. Testing Checklist
- [ ] First install on clean system
- [ ] App opens to http://localhost:3000
- [ ] Create test quiz/data
- [ ] Restart PC (data should persist)
- [ ] Manual run of run.ps1 works
- [ ] Container startup/stop works
- [ ] Uninstall without data loss
- [ ] Reinstall finds existing data

## Distribution

### Method 1: Direct Distribution
1. Share `IntelliQuizzInstaller.exe` directly
2. Users run as Administrator
3. Installation automatic

### Method 2: Package with Instructions
1. Create distribution folder:
   ```
   IntelliQuiz-v1.0/
   ├── IntelliQuizzInstaller.exe
   ├── INSTALL_INFO.txt
   ├── README.md
   └── SYSTEM_REQUIREMENTS.txt
   ```
2. Compress to .zip and distribute
3. Users extract and run installer

### Method 3: GitHub Releases
1. Create GitHub release: `v1.0.0`
2. Upload `IntelliQuizzInstaller.exe`
3. Add release notes
4. Users download and install

## Troubleshooting Installer Build

### Issue: "Inno Setup not found"
Solution: 
```
Install from: https://jrsoftware.org/isdl.php
Add to PATH or use full path
```

### Issue: ".tar files too large"
Solution:
- Use compression for distribution (7-zip, WinRAR)
- Store images separately on cloud
- Create smaller installer with image download option

### Issue: "File not found" during compilation
Solution:
- Verify all .tar files exist in `images/` folder
- Check file paths in .iss script
- Use absolute paths if needed

### Issue: "Invalid setup script"
Solution:
- Check for typos in .iss file
- Use Inno Setup's syntax checker
- Download sample scripts from Inno website

## Updating the Installer

### To Release New Version:
1. Update image .tar files
   ```bash
   docker build -t intelliquiz-frontend:latest .
   docker save -o IntelliQuizzPackage/images/intelliquiz-frontend.tar intelliquiz-frontend:latest
   ```

2. Update version in `IntelliQuizzInstaller.iss`:
   ```ini
   AppVersion=1.0.1
   ```

3. Rebuild the installer
   ```
   File → Compile
   ```

4. Test on clean system

5. Release new .exe

## Production Deployment Workflow

```
┌─────────────────────┐
│  Develop & Test     │
│  (local machine)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Build Docker Images │
│ (docker build)      │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Create .tar Files   │
│ (docker save)       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Run Inno Setup      │
│ (compile script)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Test on Clean VM    │
│ (validation)        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Release .exe        │
│ (distribute)        │
└─────────────────────┘
```

## Key Features Automated

✓ **One-Click Install**
- User runs .exe
- Everything configured automatically

✓ **No Docker Desktop Required**
- Uses lightweight Podman instead
- No license issues

✓ **Persistent Storage**
- All data in `C:\IntelliQuiz\data`
- Survives restarts and reinstalls

✓ **Auto-Start**
- Scheduled task created
- Runs on system boot

✓ **Easy Uninstall**
- Control Panel → Programs
- Data preserved for backup

✓ **Self-Contained**
- Single .exe includes everything
- No separate downloads

## Next Steps

1. Build Docker images
2. Create .tar files
3. Copy scripts and config to package
4. Build installer with Inno Setup
5. Test on clean Windows VM
6. Release to end users

---

**Version:** 1.0.0  
**Last Updated:** April 2026  
**Status:** Production Ready
