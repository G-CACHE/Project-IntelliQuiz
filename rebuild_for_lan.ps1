# Rebuild IntelliQuiz with LAN Access Configuration
# This script rebuilds the frontend with new configuration and packages everything

Write-Host "=== IntelliQuiz LAN Access Rebuild ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Rebuild frontend image
Write-Host "[1/4] Rebuilding frontend image with LAN configuration..." -ForegroundColor Yellow
Set-Location frontend/intelliquiz-frontend
docker build -t intelliquiz-frontend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ../..
Write-Host "OK - Frontend image rebuilt" -ForegroundColor Green
Write-Host ""

# Step 2: Export images
Write-Host "[2/4] Exporting Docker images..." -ForegroundColor Yellow
Set-Location IntelliQuizzPackage

# Create images directory if it doesn't exist
if (!(Test-Path "images")) {
    New-Item -ItemType Directory -Path "images" | Out-Null
}

# Export frontend
Write-Host "  Exporting frontend..."
docker save intelliquiz-frontend:latest | gzip > images/intelliquiz-frontend.tar.gz
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend export failed!" -ForegroundColor Red
    exit 1
}

# Export backend (if not already exported)
if (!(Test-Path "images/intelliquiz-backend.tar.gz")) {
    Write-Host "  Exporting backend..."
    docker save danielvictorioso/intelliquiz-backend:latest | gzip > images/intelliquiz-backend.tar.gz
}

# Export database (if not already exported)
if (!(Test-Path "images/intelliquiz-db.tar.gz")) {
    Write-Host "  Exporting database..."
    docker save danielvictorioso/intelliquiz-db:latest | gzip > images/intelliquiz-db.tar.gz
}

Write-Host "OK - Images exported" -ForegroundColor Green
Write-Host ""

# Step 3: Build installer
Write-Host "[3/4] Building installer..." -ForegroundColor Yellow
$innoSetup = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (Test-Path $innoSetup) {
    & $innoSetup "IntelliQuizzInstaller.iss"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Installer build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK - Installer built" -ForegroundColor Green
} else {
    Write-Host "WARNING: Inno Setup not found at $innoSetup" -ForegroundColor Yellow
    Write-Host "Please build manually using Inno Setup Compiler" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Summary
Write-Host "[4/4] Summary" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== REBUILD COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Changes applied:" -ForegroundColor Cyan
Write-Host "  ✓ Frontend uses nginx (production-ready)"
Write-Host "  ✓ All services bind to 0.0.0.0 (LAN accessible)"
Write-Host "  ✓ API calls use relative URLs via nginx proxy"
Write-Host "  ✓ No hardcoded localhost URLs"
Write-Host ""
Write-Host "LAN Access:" -ForegroundColor Cyan
Write-Host "  Server: Install and run IntelliQuiz"
Write-Host "  Clients: Access http://[SERVER_IP]:3000"
Write-Host "  Example: http://10.243.101.147:3000"
Write-Host ""
Write-Host "Installer location:" -ForegroundColor Cyan
Write-Host "  IntelliQuizzPackage\output\IntelliQuizzInstaller.exe"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  IntelliQuizzPackage\LAN_ACCESS_GUIDE.txt"
Write-Host ""

Set-Location ..
