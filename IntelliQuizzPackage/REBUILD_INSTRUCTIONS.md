# How to Rebuild the Installer with Fixed Scripts

## The Problem
The PowerShell scripts on the other device have syntax errors because they're using the OLD version from the previous installer build. You need to rebuild the installer to include the FIXED scripts.

## Solution: Rebuild the Installer

### Option 1: Quick Rebuild (Recommended)
This builds an installer that will download Docker automatically during installation.

```powershell
cd IntelliQuizzPackage
.\rebuild_installer_quick.ps1
```

This will:
- ✓ Verify Docker images are present
- ✓ Build new installer with FIXED PowerShell scripts
- ✓ Create `output\IntelliQuizzInstaller.exe`

### Option 2: Full Offline Build
This bundles Docker Desktop installer (~500MB) for completely offline installation.

1. Download Docker Desktop installer:
   ```
   https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
   ```

2. Save it as:
   ```
   IntelliQuizzPackage\docker\DockerDesktopInstaller.exe
   ```

3. Run the build script:
   ```powershell
   cd IntelliQuizzPackage
   .\build_installer.ps1
   ```

## After Rebuilding

1. **Copy the new installer** to the other device:
   ```
   IntelliQuizzPackage\output\IntelliQuizzInstaller.exe
   ```

2. **Run the new installer** on the other device as Administrator

3. **The fixed scripts will now work** without syntax errors

## What Was Fixed

The PowerShell scripts had variable interpolation issues:

### Before (BROKEN):
```powershell
Write-Host "Disk space: $freeSpaceGB GB"
#                                  ^^ PowerShell thinks this is a command
```

### After (FIXED):
```powershell
Write-Host "Disk space: ${freeSpaceGB} GB"
#                       ^^^^^^^^^^^^^^ Explicitly delimited variable
```

## Files That Were Fixed
- ✓ `scripts/install_docker.ps1` (3 fixes)
- ✓ `scripts/check_requirements.ps1` (4 fixes)

## Verification

After rebuilding, the new installer will contain the fixed scripts. You can verify by:

1. Extract the installer (optional):
   ```powershell
   .\IntelliQuizzInstaller.exe /VERYSILENT /SUPPRESSMSGBOXES /DIR=C:\TestExtract
   ```

2. Check the script:
   ```powershell
   Get-Content C:\TestExtract\scripts\install_docker.ps1 | Select-String "freeSpaceGB"
   ```

   Should show: `${freeSpaceGB}` (with curly braces)

## Quick Test

After installing on the other device, Docker installation should work:

```
[1/4] Checking Docker Desktop...
Docker Desktop not found. Installing automatically...

Checking system requirements...
  ✓ Windows version OK
  ✓ Disk space OK (45.23 GB free)    <-- This line should work now!
  ✓ WSL2 already enabled

Downloading Docker Desktop installer...
```

No more syntax errors!
