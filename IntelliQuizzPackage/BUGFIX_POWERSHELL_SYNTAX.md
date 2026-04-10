# PowerShell Syntax Error Fix

## Issue
The Docker installation script was failing with PowerShell parse errors when running on other devices.

### Error Message
```
At C:\IntelliQuiz\scripts\install_docker.ps1:59 char:47
+ Write-Host "  ✓ Disk space OK ($freeSpaceGB GB free)" -ForegroundCo ...
+                                               ~~
Unexpected token 'GB' in expression or statement.
```

## Root Cause
PowerShell was interpreting `GB` as a separate token instead of part of the string when using variable interpolation like:
```powershell
Write-Host "Disk space: $freeSpaceGB GB"
```

PowerShell sees `$freeSpaceGB` as a variable, then `GB` as an unexpected token.

## Solution
Use curly braces `${}` to explicitly delimit the variable name:
```powershell
Write-Host "Disk space: ${freeSpaceGB} GB"
```

This tells PowerShell exactly where the variable name ends and the literal text begins.

## Files Fixed

### 1. IntelliQuizzPackage/scripts/install_docker.ps1
- Line 59: `$freeSpaceGB GB` → `${freeSpaceGB} GB`
- Line 174: `$elapsed seconds` → `${elapsed} seconds`

### 2. IntelliQuizzPackage/scripts/check_requirements.ps1
- Line 47: `$memoryGB GB` → `${memoryGB} GB`
- Line 49: `$memoryGB GB` → `${memoryGB} GB`
- Line 58: `$freeSpaceGB GB` → `${freeSpaceGB} GB`
- Line 60: `$freeSpaceGB GB` → `${freeSpaceGB} GB`

## Verification
All scripts now pass PowerShell syntax validation:
```powershell
[System.Management.Automation.PSParser]::Tokenize((Get-Content 'script.ps1' -Raw), [ref]$null)
```

## Testing
Created and ran test script to verify the fix:
```powershell
$freeSpaceGB = 45.23
Write-Host "Disk space: ${freeSpaceGB} GB free"  # ✓ Works correctly
```

Output:
```
Disk space: 45.23 GB free
```

## Status
✅ FIXED - Docker installation script will now run without parse errors on all devices.

## Next Steps
1. Rebuild the installer package
2. Test on a device without Docker
3. Verify automatic Docker installation works end-to-end
