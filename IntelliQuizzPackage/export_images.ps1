# Export Docker Images to TAR files for offline distribution
# This creates portable image files that can be bundled with the installer

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Exporting Docker Images for Offline Distribution" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$outputDir = ".\images"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Images to export
$images = @(
    @{Name="danielvictorioso/intelliquiz-db:latest"; File="intelliquiz-db.tar"; ExportName="danielvictorioso/intelliquiz-db:latest"},
    @{Name="danielvictorioso/intelliquiz-backend:latest"; File="intelliquiz-backend.tar"; ExportName="danielvictorioso/intelliquiz-backend:latest"},
    @{Name="localhost/intelliquiz-frontend:latest"; File="intelliquiz-frontend.tar"; ExportName="intelliquiz-frontend:latest"}
)

foreach ($image in $images) {
    Write-Host "Exporting $($image.Name)..." -ForegroundColor Yellow
    
    $outputPath = Join-Path $outputDir $image.File
    
    try {
        # Tag image with correct name for export (remove localhost/ prefix if present)
        if ($image.Name -ne $image.ExportName) {
            Write-Host "  Tagging as $($image.ExportName)..." -ForegroundColor Gray
            & docker tag $image.Name $image.ExportName
        }
        
        # Export to tar with the correct tag
        Write-Host "  Saving to $($image.File)..." -ForegroundColor Gray
        & docker save -o $outputPath $image.ExportName
        
        $fileSize = [math]::Round((Get-Item $outputPath).Length / 1MB, 2)
        Write-Host "  ✓ Exported ($fileSize MB)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to export $($image.Name)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Export Complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Images saved to: $outputDir" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Compress images: .\compress_images.ps1" -ForegroundColor Yellow
Write-Host "2. Rebuild the installer with Inno Setup" -ForegroundColor Yellow
Write-Host ""
