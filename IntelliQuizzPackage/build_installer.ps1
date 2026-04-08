# Automated Build Script for Offline IntelliQuiz Installer

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IntelliQuiz Offline Installer Builder" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for Docker Desktop installer
Write-Host "[1/3] Checking for Docker Desktop installer..." -ForegroundColor Yellow
if (Test-Path ".\docker\DockerDesktopInstaller.exe") {
    $size = [math]::Round((Get-Item ".\docker\DockerDesktopInstaller.exe").Length / 1MB, 2)
    Write-Host "  OK - Found DockerDesktopInstaller.exe ($size MB)" -ForegroundColor Green
} else {
    Write-Host "  ERROR - Docker Desktop installer not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download Docker Desktop installer:" -ForegroundColor Yellow
    Write-Host "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Save it as: .\docker\DockerDesktopInstaller.exe" -ForegroundColor Yellow
    exit 1
}

# Step 2: Verify images
Write-Host "[2/3] Verifying Docker images..." -ForegroundColor Yellow
$imageFiles = @("intelliquiz-db.tar.gz", "intelliquiz-backend.tar.gz", "intelliquiz-frontend.tar.gz")
$allImagesExist = $true

foreach ($img in $imageFiles) {
    $path = ".\images\$img"
    if (Test-Path $path) {
        $sizeMB = [math]::Round((Get-Item $path).Length / 1MB, 2)
        Write-Host "  OK - $img ($sizeMB MB)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING - $img" -ForegroundColor Red
        $allImagesExist = $false
    }
}

if (-not $allImagesExist) {
    Write-Host ""
    Write-Host "ERROR: Some images are missing!" -ForegroundColor Red
    Write-Host "Run export_images.ps1 to create the image files" -ForegroundColor Yellow
    exit 1
}

# Step 3: Build installer with Inno Setup
Write-Host "[3/3] Building installer with Inno Setup..." -ForegroundColor Yellow

$innoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

if (-not (Test-Path $innoSetupPath)) {
    Write-Host "  ERROR: Inno Setup not found" -ForegroundColor Red
    Write-Host "  Install from: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Compiling (this may take 5-10 minutes)..." -ForegroundColor Gray

try {
    & $innoSetupPath "IntelliQuizzInstaller.iss" | Out-Null
    
    if (Test-Path ".\output\IntelliQuizzInstaller.exe") {
        $installerSizeMB = [math]::Round((Get-Item ".\output\IntelliQuizzInstaller.exe").Length / 1MB, 2)
        
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "BUILD COMPLETE!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Installer: .\output\IntelliQuizzInstaller.exe" -ForegroundColor Green
        Write-Host "Size: $installerSizeMB MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "Features:" -ForegroundColor Cyan
        Write-Host "  - Fully offline (no internet required)" -ForegroundColor White
        Write-Host "  - Includes Docker Desktop installer" -ForegroundColor White
        Write-Host "  - Includes all Docker images" -ForegroundColor White
        Write-Host "  - One-click installation" -ForegroundColor White
        Write-Host "  - Port forwarding works out of the box" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "  ERROR: Installer was not created" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ERROR: Build failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
