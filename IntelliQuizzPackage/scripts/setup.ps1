# IntelliQuiz Production Setup Script
# Run as Administrator
# This script sets up Docker Desktop, creates directories, and configures auto-start

$ErrorActionPreference = "Stop"
$appDir = "C:\IntelliQuiz"
$dataDir = "$appDir\data"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IntelliQuiz Production Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script must run as Administrator!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 1: Check Docker Desktop installation
Write-Host "Step 1: Checking Docker Desktop installation..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✓ Docker Desktop is already installed" -ForegroundColor Green
} else {
    Write-Host "Docker Desktop not found. Installing..." -ForegroundColor Yellow
    
    # Check if installer is bundled
    $bundledInstaller = "$appDir\docker\DockerDesktopInstaller.exe"
    if (Test-Path $bundledInstaller) {
        Write-Host "Using bundled Docker Desktop installer..." -ForegroundColor Yellow
        & $bundledInstaller install --quiet --accept-license
    } else {
        Write-Host "ERROR: Docker Desktop installer not found!" -ForegroundColor Red
        Write-Host "Please install Docker Desktop manually:" -ForegroundColor Yellow
        Write-Host "  Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "Docker Desktop installation initiated. Waiting for startup..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

Write-Host "✓ Docker Desktop is available" -ForegroundColor Green
Write-Host ""

# Step 2: Start Docker Desktop if not running
Write-Host "Step 2: Checking Docker Desktop status..." -ForegroundColor Yellow
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    Write-Host "Waiting for Docker Desktop to start..." -ForegroundColor Yellow
    $maxRetries = 24
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        Start-Sleep -Seconds 5
        docker info >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Docker Desktop is running" -ForegroundColor Green
            break
        }
        $retryCount++
        Write-Host "  Still starting... ($retryCount/$maxRetries)" -ForegroundColor Gray
    }
    
    if ($retryCount -eq $maxRetries) {
        Write-Host "WARNING: Docker Desktop may still be starting" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Docker Desktop is already running" -ForegroundColor Green
}
Write-Host ""

# Step 3: Create data directories
Write-Host "Step 3: Creating persistent data directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$dataDir\postgres" -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Path "$dataDir\backups" -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Path "$dataDir\logs" -Force -ErrorAction SilentlyContinue | Out-Null
Write-Host "✓ Data directories created at: $dataDir" -ForegroundColor Green
Write-Host "  - postgres/    (Database storage)" -ForegroundColor Green
Write-Host "  - backups/     (Database backups)" -ForegroundColor Green
Write-Host "  - logs/        (Application logs)" -ForegroundColor Green
Write-Host ""

# Step 4: Create scheduled task for auto-start
Write-Host "Step 4: Setting up auto-start on system boot..." -ForegroundColor Yellow

$taskName = "IntelliQuizzAutoStart"
$scriptPath = "$appDir\launch_intelliquiz.bat"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Auto-start task already exists. Updating..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
}

$action = New-ScheduledTaskAction `
  -Execute "cmd.exe" `
  -Argument "/c ""$scriptPath"""

$trigger = New-ScheduledTaskTrigger -AtStartup

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RunOnlyIfNetworkAvailable `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force | Out-Null

Write-Host "✓ Auto-start task created: $taskName" -ForegroundColor Green
Write-Host "  App will automatically start on system boot" -ForegroundColor Green
Write-Host ""

# Step 5: Create desktop shortcut
Write-Host "Step 5: Creating desktop shortcut..." -ForegroundColor Yellow
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = "$desktop\IntelliQuiz.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $scriptPath
$shortcut.WorkingDirectory = $appDir
$shortcut.IconLocation = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
$shortcut.Save()
Write-Host "✓ Desktop shortcut created: IntelliQuiz.lnk" -ForegroundColor Green
Write-Host ""

# Final message
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Docker Desktop installed and ready" -ForegroundColor Green
Write-Host "✓ Data directory: $dataDir" -ForegroundColor Green
Write-Host "✓ Auto-start enabled (runs on boot)" -ForegroundColor Green
Write-Host "✓ Desktop shortcut created" -ForegroundColor Green
Write-Host ""
Write-Host "The application will start when you run $scriptPath" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to close this window"
