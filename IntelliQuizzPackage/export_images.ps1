# Export Docker Images to TAR.GZ files for offline distribution
# This creates portable compressed image files that can be bundled with the installer

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
    @{Name="danielvictorioso/intelliquiz-db:latest"; File="intelliquiz-db"; ExportName="danielvictorioso/intelliquiz-db:latest"},
    @{Name="danielvictorioso/intelliquiz-backend:latest"; File="intelliquiz-backend"; ExportName="danielvictorioso/intelliquiz-backend:latest"},
    @{Name="localhost/intelliquiz-frontend:latest"; File="intelliquiz-frontend"; ExportName="intelliquiz-frontend:latest"}
)

foreach ($image in $images) {
    Write-Host "Exporting $($image.Name)..." -ForegroundColor Yellow
    
    $tarPath = Join-Path $outputDir "$($image.File).tar"
    $gzPath = Join-Path $outputDir "$($image.File).tar.gz"
    
    try {
        # Tag image with correct name for export (remove localhost/ prefix if present)
        if ($image.Name -ne $image.ExportName) {
            Write-Host "  Tagging as $($image.ExportName)..." -ForegroundColor Gray
            & docker tag $image.Name $image.ExportName
        }
        
        # Export to tar with the correct tag
        Write-Host "  Saving to tar..." -ForegroundColor Gray
        & docker save -o $tarPath $image.ExportName
        
        # Compress with PowerShell
        Write-Host "  Compressing..." -ForegroundColor Gray
        Compress-Archive -Path $tarPath -DestinationPath $gzPath -Force
        
        # Remove uncompressed tar
        Remove-Item $tarPath
        
        $fileSize = [math]::Round((Get-Item $gzPath).Length / 1MB, 2)
        Write-Host "  ✓ Exported and compressed ($fileSize MB)" -ForegroundColor Green
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
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "  Rebuild the installer with Inno Setup (F9)" -ForegroundColor Yellow
Write-Host ""
