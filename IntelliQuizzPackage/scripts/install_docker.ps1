# Automatic Docker Desktop Installation Script
# Downloads and installs Docker Desktop silently if not present

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Docker Desktop Installation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is installed and working
function Test-DockerInstalled {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        return $true
    }
    if (Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe") {
        return $true
    }
    return $false
}

# Check if Docker Desktop is already installed
if (Test-DockerInstalled) {
    Write-Host "??? Docker Desktop is already installed" -ForegroundColor Green
    
    # Verify Docker is in PATH
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "Adding Docker to PATH..." -ForegroundColor Yellow
        $env:Path += ";C:\Program Files\Docker\Docker\resources\bin"
        [Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
    }
    
    exit 0
}

Write-Host "Docker Desktop not found. Installing automatically..." -ForegroundColor Yellow
Write-Host ""

# Check system requirements first
Write-Host "Checking system requirements..." -ForegroundColor Yellow

# Check Windows version
$winVersion = [System.Environment]::OSVersion.Version
if ($winVersion.Major -lt 10) {
    Write-Host "ERROR: Windows 10 or later is required for Docker Desktop" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  ??? Windows version OK" -ForegroundColor Green

# Check available disk space
$drive = Get-PSDrive C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -lt 5) {
    Write-Host "ERROR: At least 5GB free disk space required (found: ${freeSpaceGB} GB)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  ??? Disk space OK (${freeSpaceGB} GB free)" -ForegroundColor Green

# Enable WSL2 if not enabled (required for Docker Desktop)
Write-Host "Checking WSL2..." -ForegroundColor Yellow
$wsl = Get-WindowsOptionalFeature -FeatureName Microsoft-Windows-Subsystem-Linux -Online -ErrorAction SilentlyContinue
if ($wsl.State -ne "Enabled") {
    Write-Host "  Enabling WSL2 (required for Docker)..." -ForegroundColor Yellow
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart -ErrorAction Stop | Out-Null
        Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart -ErrorAction Stop | Out-Null
        Write-Host "  ??? WSL2 enabled" -ForegroundColor Green
    } catch {
        Write-Host "  ??? Could not enable WSL2 automatically" -ForegroundColor Yellow
        Write-Host "    Docker Desktop will attempt to enable it during installation" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ??? WSL2 already enabled" -ForegroundColor Green
}

Write-Host ""

# Check if installer is bundled
$bundledInstaller = "C:\IntelliQuiz\docker\DockerDesktopInstaller.exe"
if (Test-Path $bundledInstaller) {
    Write-Host "Using bundled Docker Desktop installer..." -ForegroundColor Yellow
    $installerPath = $bundledInstaller
} else {
    # Download Docker Desktop installer
    $installerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    Write-Host "Downloading Docker Desktop installer (approx. 500MB)..." -ForegroundColor Yellow
    Write-Host "This may take several minutes depending on your connection..." -ForegroundColor Gray
    Write-Host "URL: $installerUrl" -ForegroundColor Gray
    Write-Host ""
    
    try {
        # Use BITS transfer for better reliability and progress
        Import-Module BitsTransfer -ErrorAction SilentlyContinue
        if (Get-Command Start-BitsTransfer -ErrorAction SilentlyContinue) {
            Start-BitsTransfer -Source $installerUrl -Destination $installerPath -DisplayName "Docker Desktop" -Description "Downloading Docker Desktop installer..."
        } else {
            # Fallback to WebClient with progress
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($installerUrl, $installerPath)
        }
        Write-Host "??? Download complete" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to download Docker Desktop installer" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please try one of these options:" -ForegroundColor Yellow
        Write-Host "  1. Check your internet connection and try again" -ForegroundColor Yellow
        Write-Host "  2. Download manually from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        Write-Host "  3. Install Docker Desktop manually, then run IntelliQuiz again" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes. Please be patient..." -ForegroundColor Gray
Write-Host ""

try {
    # Run installer silently with proper arguments
    Write-Host "Running installer..." -ForegroundColor Yellow
    $installArgs = @("install", "--quiet", "--accept-license")
    $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "??? Docker Desktop installed successfully" -ForegroundColor Green
        
        # Add Docker to PATH
        Write-Host "Configuring environment..." -ForegroundColor Yellow
        $dockerPath = "C:\Program Files\Docker\Docker\resources\bin"
        $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
        if ($currentPath -notlike "*$dockerPath*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$dockerPath", [EnvironmentVariableTarget]::Machine)
            $env:Path += ";$dockerPath"
        }
        Write-Host "??? Environment configured" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Starting Docker Desktop for the first time..." -ForegroundColor Yellow
        
        # Start Docker Desktop
        if (Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe") {
            Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
        }
        
        Write-Host "Waiting for Docker Desktop to initialize..." -ForegroundColor Yellow
        Write-Host "First startup may take 2-3 minutes..." -ForegroundColor Gray
        Write-Host ""
        
        # Wait for Docker to be ready with better feedback
        $maxRetries = 36  # 3 minutes
        $retryCount = 0
        $dockerReady = $false
        
        while ($retryCount -lt $maxRetries) {
            Start-Sleep -Seconds 5
            try {
                $null = docker info 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "??? Docker Desktop is ready!" -ForegroundColor Green
                    $dockerReady = $true
                    break
                }
            } catch {
                # Docker not ready yet
            }
            $retryCount++
            $elapsed = $retryCount * 5
            Write-Host "  Still initializing... (${elapsed} seconds elapsed)" -ForegroundColor Gray
        }
        
        if (-not $dockerReady) {
            Write-Host ""
            Write-Host "??? Docker Desktop is taking longer than expected to start" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "This is normal on first installation. Please:" -ForegroundColor Yellow
            Write-Host "  1. Wait for Docker Desktop to fully start (check system tray)" -ForegroundColor Yellow
            Write-Host "  2. You may need to restart your computer" -ForegroundColor Yellow
            Write-Host "  3. After restart, run IntelliQuiz again" -ForegroundColor Yellow
            Write-Host ""
        }
        
    } elseif ($process.ExitCode -eq 1) {
        Write-Host "??? Installation completed with warnings (exit code: 1)" -ForegroundColor Yellow
        Write-Host "Docker Desktop may have been installed but requires configuration" -ForegroundColor Yellow
        Write-Host "Please check Docker Desktop in your Start Menu" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common solutions:" -ForegroundColor Yellow
        Write-Host "  1. Ensure virtualization is enabled in BIOS" -ForegroundColor Yellow
        Write-Host "  2. Restart your computer and try again" -ForegroundColor Yellow
        Write-Host "  3. Install Docker Desktop manually from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to install Docker Desktop" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} finally {
    # Cleanup installer if downloaded
    if ($installerPath -ne $bundledInstaller -and (Test-Path $installerPath)) {
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Docker Desktop installation complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

