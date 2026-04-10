# Quick Rebuild Script for IntelliQuiz Installer
# This version builds WITHOUT bundling Docker Desktop installer
# Docker will be downloaded automatically during installation

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IntelliQuiz Installer - Quick Rebuild" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify images
Write-Host "[1/2] Verifying Docker images..." -ForegroundColor Yellow
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

# Step 2: Build installer with Inno Setup
Write-Host "[2/2] Building installer with Inno Setup..." -ForegroundColor Yellow

$innoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

if (-not (Test-Path $innoSetupPath)) {
    Write-Host "  ERROR: Inno Setup not found" -ForegroundColor Red
    Write-Host "  Install from: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Compiling (this may take 3-5 minutes)..." -ForegroundColor Gray
Write-Host "  Note: Docker Desktop will be downloaded during installation" -ForegroundColor Gray

try {
    & $innoSetupPath "IntelliQuizzInstaller.iss"
    
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
        Write-Host "  ✓ Automatic Docker installation (downloads if needed)" -ForegroundColor White
        Write-Host "  ✓ Includes all IntelliQuiz Docker images" -ForegroundColor White
        Write-Host "  ✓ One-click installation and launch" -ForegroundColor White
        Write-Host "  ✓ Fixed PowerShell syntax errors" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANT:" -ForegroundColor Yellow
        Write-Host "  - Internet connection required on target device" -ForegroundColor Yellow
        Write-Host "  - Docker Desktop (~500MB) will download automatically" -ForegroundColor Yellow
        Write-Host "  - First installation takes 10-15 minutes" -ForegroundColor Yellow
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

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Copy .\output\IntelliQuizzInstaller.exe to target device" -ForegroundColor White
Write-Host "  2. Run as Administrator on target device" -ForegroundColor White
Write-Host "  3. Docker will be installed automatically if not present" -ForegroundColor White
Write-Host ""
