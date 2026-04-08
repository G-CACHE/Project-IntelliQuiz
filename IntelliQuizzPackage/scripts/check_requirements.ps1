# System Requirements Check for IntelliQuiz
# Verifies that the system can run Docker Desktop

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IntelliQuiz System Requirements Check" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$allChecksPassed = $true

# Check 1: Windows Version
Write-Host "[1/5] Checking Windows version..." -ForegroundColor Yellow
$winVersion = [System.Environment]::OSVersion.Version
if ($winVersion.Major -ge 10) {
    Write-Host "  ✓ Windows 10/11 detected" -ForegroundColor Green
} else {
    Write-Host "  ✗ Windows 10 or later is required" -ForegroundColor Red
    $allChecksPassed = $false
}
Write-Host ""

# Check 2: Virtualization
Write-Host "[2/5] Checking virtualization support..." -ForegroundColor Yellow
try {
    $hyperv = Get-WindowsOptionalFeature -FeatureName Microsoft-Hyper-V-All -Online -ErrorAction SilentlyContinue
    $wsl = Get-WindowsOptionalFeature -FeatureName Microsoft-Windows-Subsystem-Linux -Online -ErrorAction SilentlyContinue
    
    if ($hyperv.State -eq "Enabled" -or $wsl.State -eq "Enabled") {
        Write-Host "  ✓ Virtualization is enabled" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Virtualization not enabled" -ForegroundColor Yellow
        Write-Host "    Docker Desktop requires either Hyper-V or WSL2" -ForegroundColor Yellow
        Write-Host "    The installer will attempt to enable WSL2" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not check virtualization status" -ForegroundColor Yellow
}
Write-Host ""

# Check 3: Memory
Write-Host "[3/5] Checking available memory..." -ForegroundColor Yellow
$memory = Get-CimInstance Win32_ComputerSystem
$memoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
if ($memoryGB -ge 4) {
    Write-Host "  ✓ $memoryGB GB RAM available" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Only $memoryGB GB RAM (4GB recommended)" -ForegroundColor Yellow
}
Write-Host ""

# Check 4: Disk Space
Write-Host "[4/5] Checking disk space..." -ForegroundColor Yellow
$drive = Get-PSDrive C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -ge 10) {
    Write-Host "  ✓ $freeSpaceGB GB free space available" -ForegroundColor Green
} else {
    Write-Host "  ✗ Only $freeSpaceGB GB free (10GB required)" -ForegroundColor Red
    $allChecksPassed = $false
}
Write-Host ""

# Check 5: Internet Connection
Write-Host "[5/5] Checking internet connection..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName google.com -Count 1 -Quiet -ErrorAction SilentlyContinue
    if ($ping) {
        Write-Host "  ✓ Internet connection available" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No internet connection detected" -ForegroundColor Yellow
        Write-Host "    Internet is required for initial setup" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not verify internet connection" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "============================================================" -ForegroundColor Cyan
if ($allChecksPassed) {
    Write-Host "✓ All critical requirements met!" -ForegroundColor Green
    Write-Host "You can proceed with installation" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some requirements not met" -ForegroundColor Red
    Write-Host "Please resolve the issues above before installing" -ForegroundColor Yellow
    exit 1
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
