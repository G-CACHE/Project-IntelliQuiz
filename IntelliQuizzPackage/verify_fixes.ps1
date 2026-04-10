# Verify PowerShell Script Fixes
# Run this before rebuilding to ensure all syntax errors are fixed

$ErrorActionPreference = "Continue"

# Change to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Verifying PowerShell Script Fixes" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Test 1: Check install_docker.ps1 syntax
Write-Host "[1/2] Checking install_docker.ps1 syntax..." -ForegroundColor Yellow
try {
    $content = Get-Content '.\scripts\install_docker.ps1' -Raw
    $null = [System.Management.Automation.PSParser]::Tokenize($content, [ref]$null)
    Write-Host "  OK - No syntax errors" -ForegroundColor Green
} catch {
    Write-Host "  ERROR - Syntax error found" -ForegroundColor Red
    Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: Check check_requirements.ps1 syntax
Write-Host "[2/2] Checking check_requirements.ps1 syntax..." -ForegroundColor Yellow
try {
    $content = Get-Content '.\scripts\check_requirements.ps1' -Raw
    $null = [System.Management.Automation.PSParser]::Tokenize($content, [ref]$null)
    Write-Host "  OK - No syntax errors" -ForegroundColor Green
} catch {
    Write-Host "  ERROR - Syntax error found" -ForegroundColor Red
    Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Scripts are ready. You can now rebuild the installer:" -ForegroundColor Green
    Write-Host "  .\rebuild_installer_quick.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above before rebuilding." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
