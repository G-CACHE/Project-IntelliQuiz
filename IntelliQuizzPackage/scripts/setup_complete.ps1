# IntelliQuiz Complete Automated Setup
# Handles virtualization, WSL, Docker installation with smart restart detection

$ErrorActionPreference = "Stop"
$appDir = "C:\IntelliQuiz"
$dataDir = "$appDir\data"
$resumeMarker = "$appDir\.setup_resume"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IntelliQuiz Automated Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script must run as Administrator!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if this is a resume after restart
$isResume = Test-Path $resumeMarker
if ($isResume) {
    Write-Host "Resuming installation after restart..." -ForegroundColor Yellow
    Write-Host ""
    Remove-Item $resumeMarker -Force
}

# STEP 1: Check virtualization support
Write-Host "[1/7] Checking virtualization support..." -ForegroundColor Yellow
$computerInfo = Get-ComputerInfo
$virtSupported = $computerInfo.HyperVRequirementVirtualizationFirmwareEnabled
$hyperVPresent = $computerInfo.HyperVisorPresent

if ($virtSupported -eq $false) {
    Write-Host "ERROR: CPU does not support virtualization" -ForegroundColor Red
    Write-Host "This device cannot run Docker Desktop" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use a device with virtualization support" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  OK - CPU supports virtualization" -ForegroundColor Green
Write-Host ""

# STEP 2: Check and enable all required features at once
Write-Host "[2/7] Checking Windows virtualization features..." -ForegroundColor Yellow
$restartNeeded = $false
$featuresEnabled = @()

if (-not $hyperVPresent -and -not $isResume) {
    Write-Host "  Checking required features..." -ForegroundColor Yellow
    
    # Check which features need to be enabled
    $hypervState = (Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue).State
    $vmpState = (Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction SilentlyContinue).State
    $wslState = (Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue).State
    
    try {
        # Enable Hyper-V if needed
        if ($hypervState -ne "Enabled") {
            Write-Host "  - Enabling Hyper-V..." -ForegroundColor Yellow
            $result1 = Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
            if ($result1.RestartNeeded) { $restartNeeded = $true }
            $featuresEnabled += "Hyper-V"
        }
        
        # Enable Virtual Machine Platform if needed
        if ($vmpState -ne "Enabled") {
            Write-Host "  - Enabling Virtual Machine Platform..." -ForegroundColor Yellow
            $result2 = Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart
            if ($result2.RestartNeeded) { $restartNeeded = $true }
            $featuresEnabled += "Virtual Machine Platform"
        }
        
        # Enable WSL2 if needed
        if ($wslState -ne "Enabled") {
            Write-Host "  - Enabling WSL2..." -ForegroundColor Yellow
            $result3 = Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart
            if ($result3.RestartNeeded) { $restartNeeded = $true }
            $featuresEnabled += "WSL2"
        }
        
        if ($featuresEnabled.Count -gt 0) {
            Write-Host "  OK - Enabled: $($featuresEnabled -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "  OK - All features already enabled" -ForegroundColor Green
        }
    } catch {
        Write-Host "  WARNING - Could not enable some features" -ForegroundColor Yellow
        Write-Host "  Docker Desktop will attempt to enable them during installation" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK - Virtualization features already enabled" -ForegroundColor Green
}
Write-Host ""

# STEP 3: Install/Update WSL kernel
Write-Host "[3/7] Checking WSL installation..." -ForegroundColor Yellow
if (-not $isResume) {
    try {
        # Check if WSL is installed
        $wslInstalled = $false
        try {
            $wslVersion = wsl --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                $wslInstalled = $true
            }
        } catch {
            $wslInstalled = $false
        }
        
        if (-not $wslInstalled) {
            Write-Host "  WSL not installed. Installing..." -ForegroundColor Yellow
            wsl --install --no-distribution 2>&1 | Out-Null
            Write-Host "  OK - WSL installed" -ForegroundColor Green
        } else {
            Write-Host "  WSL already installed. Checking for updates..." -ForegroundColor Yellow
            wsl --update 2>&1 | Out-Null
            Write-Host "  OK - WSL is up to date" -ForegroundColor Green
        }
    } catch {
        Write-Host "  WARNING - Could not install/update WSL" -ForegroundColor Yellow
        Write-Host "  WSL will be configured when Docker Desktop starts" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK - WSL check skipped (resuming after restart)" -ForegroundColor Green
}
Write-Host ""

# STEP 4: Handle restart if needed
if ($restartNeeded -and -not $isResume) {
    Write-Host "[4/7] Restart required to activate virtualization features" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "RESTART REQUIRED" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The computer will restart in 10 seconds..." -ForegroundColor Yellow
    Write-Host "Installation will continue automatically after restart." -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to cancel restart" -ForegroundColor Gray
    Write-Host ""
    
    # Create resume marker
    "RESUME" | Out-File $resumeMarker -Force
    
    # Create scheduled task to resume after restart
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$appDir\scripts\setup_complete.ps1`""
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    
    Register-ScheduledTask -TaskName "IntelliQuizSetupResume" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    
    # Countdown
    for ($i = 10; $i -gt 0; $i--) {
        Write-Host "  Restarting in $i seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }
    
    Restart-Computer -Force
    exit 0
}

# Remove resume task if it exists
Unregister-ScheduledTask -TaskName "IntelliQuizSetupResume" -Confirm:$false -ErrorAction SilentlyContinue

Write-Host "[4/7] No restart needed - continuing installation..." -ForegroundColor Green
Write-Host ""

# STEP 5: Check and install Docker Desktop
Write-Host "[5/7] Checking Docker Desktop..." -ForegroundColor Yellow

function Test-DockerInstalled {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        return $true
    }
    if (Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe") {
        return $true
    }
    return $false
}

if (Test-DockerInstalled) {
    Write-Host "  OK - Docker Desktop already installed" -ForegroundColor Green
} else {
    Write-Host "  Docker not found. Installing..." -ForegroundColor Yellow
    
    # Download Docker Desktop
    $installerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    Write-Host "  Downloading Docker Desktop (~500MB)..." -ForegroundColor Yellow
    try {
        Import-Module BitsTransfer -ErrorAction SilentlyContinue
        if (Get-Command Start-BitsTransfer -ErrorAction SilentlyContinue) {
            Start-BitsTransfer -Source $installerUrl -Destination $installerPath
        } else {
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($installerUrl, $installerPath)
        }
        Write-Host "  OK - Download complete" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: Failed to download Docker Desktop" -ForegroundColor Red
        Write-Host "  Please check internet connection" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Install Docker Desktop
    Write-Host "  Installing Docker Desktop (5-10 minutes)..." -ForegroundColor Yellow
    $installArgs = @("install", "--quiet", "--accept-license", "--backend=wsl-2")
    $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 1) {
        Write-Host "  OK - Docker Desktop installed" -ForegroundColor Green
        
        # Add to PATH
        $dockerPath = "C:\Program Files\Docker\Docker\resources\bin"
        $env:Path += ";$dockerPath"
        
        # Cleanup
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "  ERROR: Docker installation failed (exit code: $($process.ExitCode))" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host ""

# STEP 6: Configure Docker to skip login
Write-Host "[6/7] Configuring Docker Desktop..." -ForegroundColor Yellow
$dockerConfigPath = "$env:APPDATA\Docker\settings.json"
if (Test-Path $dockerConfigPath) {
    try {
        $config = Get-Content $dockerConfigPath | ConvertFrom-Json
        $config | Add-Member -NotePropertyName "analyticsEnabled" -NotePropertyValue $false -Force
        $config | Add-Member -NotePropertyName "autoStart" -NotePropertyValue $false -Force
        $config | ConvertTo-Json -Depth 10 | Set-Content $dockerConfigPath
        Write-Host "  OK - Docker configured" -ForegroundColor Green
    } catch {
        Write-Host "  WARNING - Could not configure Docker settings" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK - Docker will use default settings" -ForegroundColor Green
}
Write-Host ""

# STEP 7: Start Docker Desktop
Write-Host "[7/7] Starting Docker Desktop..." -ForegroundColor Yellow
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    if (Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe") {
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    }
    
    Write-Host "  Waiting for Docker to start..." -ForegroundColor Yellow
    $maxRetries = 36
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        Start-Sleep -Seconds 5
        docker info >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK - Docker is ready" -ForegroundColor Green
            break
        }
        $retryCount++
        if ($retryCount % 6 -eq 0) {
            Write-Host "  Still starting... ($($retryCount * 5) seconds)" -ForegroundColor Gray
        }
    }
    
    if ($retryCount -eq $maxRetries) {
        Write-Host "  WARNING - Docker is taking longer than expected" -ForegroundColor Yellow
        Write-Host "  You may need to start Docker Desktop manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK - Docker already running" -ForegroundColor Green
}
Write-Host ""

# Create data directories
Write-Host "Creating data directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$dataDir\postgres" -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Path "$dataDir\backups" -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Path "$dataDir\logs" -Force -ErrorAction SilentlyContinue | Out-Null
Write-Host "OK - Data directories created" -ForegroundColor Green
Write-Host ""

# Final message
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IntelliQuiz is ready to use!" -ForegroundColor Green
Write-Host ""
Write-Host "To start IntelliQuiz:" -ForegroundColor Cyan
Write-Host "  - Double-click the IntelliQuiz desktop shortcut" -ForegroundColor White
Write-Host "  - Or run: $appDir\launch_intelliquiz.bat" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to close this window..." -ForegroundColor Gray
Read-Host

# Optionally launch IntelliQuiz
$launch = Read-Host "Would you like to launch IntelliQuiz now? (Y/N)"
if ($launch -eq "Y" -or $launch -eq "y") {
    Start-Process "$appDir\launch_intelliquiz.bat"
}
