# IntelliQuiz Cleanup Script
# Stops containers and removes port forwarding rules

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IntelliQuiz Cleanup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Stop containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
podman stop intelliquiz_frontend intelliquiz_backend intelliquiz_db 2>$null
Write-Host "  Done" -ForegroundColor Green
Write-Host ""

# Remove containers
Write-Host "Removing containers..." -ForegroundColor Yellow
podman rm -f intelliquiz_frontend intelliquiz_backend intelliquiz_db 2>$null
Write-Host "  Done" -ForegroundColor Green
Write-Host ""

# Remove port forwarding rules
Write-Host "Removing port forwarding rules..." -ForegroundColor Yellow
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=8090 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=5434 listenaddress=0.0.0.0 2>$null
Write-Host "  Done" -ForegroundColor Green
Write-Host ""

# Stop Podman machine
Write-Host "Stopping Podman machine..." -ForegroundColor Yellow
podman machine stop 2>$null
Write-Host "  Done" -ForegroundColor Green
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
