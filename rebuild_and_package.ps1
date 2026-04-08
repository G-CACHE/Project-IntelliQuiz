# Complete rebuild script - fixes frontend and packages everything
$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IntelliQuiz Complete Rebuild and Package" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Rebuild frontend image with fixed nginx config
Write-Host "[1/4] Rebuilding frontend Docker image..." -ForegroundColor Yellow
Write-Host "  This will take 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

try {
    $buildOutput = docker build -t intelliquiz-frontend:latest frontend/intelliquiz-frontend/ 2>&1
    Write-Host "  OK - Frontend image rebuilt" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to rebuild frontend image" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Export all images
Write-Host "[2/4] Exporting Docker images..." -ForegroundColor Yellow

$images = @(
    @{Name="danielvictorioso/intelliquiz-db:latest"; File="intelliquiz-db.tar.gz"},
    @{Name="danielvictorioso/intelliquiz-backend:latest"; File="intelliquiz-backend.tar.gz"},
    @{Name="intelliquiz-frontend:latest"; File="intelliquiz-frontend.tar.gz"}
)

foreach ($img in $images) {
    Write-Host "  Exporting $($img.Name)..." -ForegroundColor Gray
    $gzPath = "IntelliQuizzPackage\images\$($img.File)"
    $tarPath = $gzPath -replace '\.gz$', ''
    
    # Export to tar first
    docker save -o $tarPath $img.Name
    
    if (Test-Path $tarPath) {
        # Compress using PowerShell
        Write-Host "    Compressing..." -ForegroundColor Gray
        $fileStream = [System.IO.File]::OpenRead($tarPath)
        $gzipStream = [System.IO.File]::Create($gzPath)
        $gzip = New-Object System.IO.Compression.GZipStream($gzipStream, [System.IO.Compression.CompressionMode]::Compress)
        $fileStream.CopyTo($gzip)
        $gzip.Close()
        $fileStream.Close()
        $gzipStream.Close()
        
        # Remove uncompressed tar
        Remove-Item $tarPath -Force
        
        $sizeMB = [math]::Round((Get-Item $gzPath).Length / 1MB, 2)
        Write-Host "    OK - $($img.File) ($sizeMB MB)" -ForegroundColor Green
    } else {
        Write-Host "    ERROR - Failed to export $($img.File)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 3: Verify all required files
Write-Host "[3/4] Verifying package contents..." -ForegroundColor Yellow

$requiredFiles = @(
    "IntelliQuizzPackage\launch_intelliquiz.bat",
    "IntelliQuizzPackage\docker-compose.prod.yml",
    "IntelliQuizzPackage\scripts\run.ps1",
    "IntelliQuizzPackage\scripts\setup.ps1",
    "IntelliQuizzPackage\scripts\load_images.ps1",
    "IntelliQuizzPackage\images\intelliquiz-db.tar.gz",
    "IntelliQuizzPackage\images\intelliquiz-backend.tar.gz",
    "IntelliQuizzPackage\images\intelliquiz-frontend.tar.gz"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  OK - $(Split-Path $file -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING - $(Split-Path $file -Leaf)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "ERROR: Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Build installer
Write-Host "[4/4] Building installer with Inno Setup..." -ForegroundColor Yellow

$innoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

if (-not (Test-Path $innoSetupPath)) {
    Write-Host "  ERROR: Inno Setup not found" -ForegroundColor Red
    Write-Host "  Install from: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Compiling installer..." -ForegroundColor Gray

try {
    & $innoSetupPath "IntelliQuizzPackage\IntelliQuizzInstaller.iss" 2>&1 | Out-Null
    
    if (Test-Path "IntelliQuizzPackage\output\IntelliQuizzInstaller.exe") {
        $installerSizeMB = [math]::Round((Get-Item "IntelliQuizzPackage\output\IntelliQuizzInstaller.exe").Length / 1MB, 2)
        
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "BUILD COMPLETE!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Installer: IntelliQuizzPackage\output\IntelliQuizzInstaller.exe" -ForegroundColor Green
        Write-Host "Size: $installerSizeMB MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "Features:" -ForegroundColor Cyan
        Write-Host "  - Fully offline (no internet required)" -ForegroundColor White
        Write-Host "  - Automatic conflict resolution" -ForegroundColor White
        Write-Host "  - Stops Docker Desktop automatically" -ForegroundColor White
        Write-Host "  - Releases port conflicts automatically" -ForegroundColor White
        Write-Host "  - Fixed frontend nginx configuration" -ForegroundColor White
        Write-Host "  - Network aliases for proper service discovery" -ForegroundColor White
        Write-Host ""
        Write-Host "The installer is ready for distribution!" -ForegroundColor Green
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
