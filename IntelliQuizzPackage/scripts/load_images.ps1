# Load Docker images from bundled TAR files
$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Loading Docker Images" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$imagesDir = "C:\IntelliQuiz\images"

if (-not (Test-Path $imagesDir)) {
    Write-Host "ERROR: Images directory not found" -ForegroundColor Red
    exit 1
}

# Check existing images
Write-Host "Checking existing images..." -ForegroundColor Yellow
$existingImages = @()
try {
    $existingImages = & docker images --format "{{.Repository}}:{{.Tag}}" 2>$null
} catch {
    Write-Host "  Warning: Could not check existing images" -ForegroundColor Yellow
}

# Images to load
$imagesToLoad = @(
    @{File="intelliquiz-db.tar.gz"; Name="danielvictorioso/intelliquiz-db:latest"},
    @{File="intelliquiz-backend.tar.gz"; Name="danielvictorioso/intelliquiz-backend:latest"},
    @{File="intelliquiz-frontend.tar.gz"; Name="localhost/intelliquiz-frontend:latest"}
)

$loadedCount = 0
$skippedCount = 0

foreach ($image in $imagesToLoad) {
    $gzPath = Join-Path $imagesDir $image.File
    $tarPath = Join-Path $imagesDir ($image.File -replace '\.gz$', '')
    
    # Check for compressed or uncompressed version
    if (Test-Path $gzPath) {
        $imagePath = $gzPath
        $isCompressed = $true
    } elseif (Test-Path $tarPath) {
        $imagePath = $tarPath
        $isCompressed = $false
    } else {
        Write-Host "  Skipping $($image.File) - not found" -ForegroundColor Yellow
        continue
    }
    
    # Check if already loaded
    if ($existingImages -contains $image.Name) {
        Write-Host "  Already loaded: $($image.Name)" -ForegroundColor Green
        $skippedCount++
        continue
    }
    
    Write-Host "  Loading $($image.File)..." -ForegroundColor Yellow
    
    try {
        if ($isCompressed) {
            # Decompress first
            Write-Host "    Decompressing..." -ForegroundColor Gray
            $tempTar = "$env:TEMP\temp_image_$([guid]::NewGuid()).tar"
            
            $fileStream = [System.IO.File]::OpenRead($imagePath)
            $gzipStream = New-Object System.IO.Compression.GZipStream($fileStream, [System.IO.Compression.CompressionMode]::Decompress)
            $outputStream = [System.IO.File]::Create($tempTar)
            $gzipStream.CopyTo($outputStream)
            $outputStream.Close()
            $gzipStream.Close()
            $fileStream.Close()
            
            # Load the decompressed tar
            & docker load -i $tempTar 2>&1 | Out-Null
            Remove-Item $tempTar -Force -ErrorAction SilentlyContinue
        } else {
            # Load directly
            & docker load -i $imagePath 2>&1 | Out-Null
        }
        
        Write-Host "    Loaded successfully" -ForegroundColor Green
        $loadedCount++
        
        # Tag localhost images to remove localhost prefix for easier use
        if ($image.Name -like "localhost/*") {
            $simpleTag = $image.Name -replace "^localhost/", ""
            & docker tag $image.Name $simpleTag 2>&1 | Out-Null
            Write-Host "    Tagged as: $simpleTag" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "    Failed to load" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Loaded: $loadedCount" -ForegroundColor Green
Write-Host "  Skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
