# Automatic Docker Desktop Installation Script
# Downloads and installs Docker Desktop silently if not present

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Docker Desktop Installation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker Desktop is already installed
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✓ Docker Desktop is already installed" -ForegroundColor Green
    exit 0
}

if (Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe") {
    Write-Host "✓ Docker Desktop is already installed" -ForegroundColor Green
    exit 0
}

Write-Host "Docker Desktop not found. Installing automatically..." -ForegroundColor Yellow
Write-Host ""

# Check if installer is bundled
$bundledInstaller = "C:\IntelliQuiz\docker\DockerDesktopInstaller.exe"
if (Test-Path $bundledInstaller) {
    Write-Host "Using bundled Docker Desktop installer..." -ForegroundColor Yellow
    $installerPath = $bundledInstaller
} else {
    # Download Docker Desktop installer
    $installerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    Write-Host "Downloading Docker Desktop installer..." -ForegroundColor Yellow
    Write-Host "URL: $installerUrl" -ForegroundColor Gray
    
    try {
        # Use WebClient for better progress
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($installerUrl, $installerPath)
        Write-Host "✓ Download complete" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to download Docker Desktop installer" -ForegroundColor Red
        Write-Host "Please download manually from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Installing Docker Desktop (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "Please wait..." -ForegroundColor Gray

try {
    # Run installer silently
    $process = Start-Process -FilePath $installerPath -ArgumentList "install", "--quiet", "--accept-license" -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✓ Docker Desktop installed successfully" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
        
        # Start Docker Desktop
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        
        Write-Host "Waiting for Docker Desktop to initialize..." -ForegroundColor Yellow
        Write-Host "This may take 1-2 minutes on first start..." -ForegroundColor Gray
        
        # Wait for Docker to be ready
        $maxRetries = 24
        $retryCount = 0
        while ($retryCount -lt $maxRetries) {
            Start-Sleep -Seconds 5
            $dockerReady = & docker info 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Docker Desktop is ready" -ForegroundColor Green
                break
            }
            $retryCount++
            Write-Host "  Still initializing... ($retryCount/$maxRetries)" -ForegroundColor Gray
        }
        
        if ($retryCount -eq $maxRetries) {
            Write-Host "WARNING: Docker Desktop may still be starting" -ForegroundColor Yellow
            Write-Host "Please wait a moment before running IntelliQuiz" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "ERROR: Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to install Docker Desktop" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} finally {
    # Cleanup installer if downloaded
    if ($installerPath -ne $bundledInstaller -and (Test-Path $installerPath)) {
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Docker Desktop installation complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
