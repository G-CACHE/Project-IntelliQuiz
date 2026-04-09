============================================================
IntelliQuiz - Installation Guide
============================================================

SYSTEM REQUIREMENTS:
- Windows 10/11 (64-bit)
- At least 4GB RAM (8GB recommended)
- 10GB free disk space
- Virtualization enabled in BIOS (usually enabled by default)
- NO internet connection required (fully offline installer)

INSTALLATION (SIMPLE - ONE CLICK):
1. Run IntelliQuizzInstaller.exe as Administrator
2. The installer will automatically:
   - Check system requirements
   - Install Docker Desktop if not present
   - Start Docker Desktop
   - Load application containers
   - Start all services

3. Wait for installation to complete (5-10 minutes on first run)

4. Access the application at: http://localhost:3000

IMPORTANT NOTES:
- The installer includes Docker Desktop (~500MB) - no download needed
- First-time setup is FULLY OFFLINE - no internet required
- You may be prompted to enable WSL2 if not already enabled
- A system restart may be required after enabling WSL2
- Port forwarding works automatically (no configuration needed)

ACCESSING THE APPLICATION:
Once installation is complete, open your web browser and go to:
http://localhost:3000

Default Admin Credentials:
- Email: admin@intelliquiz.com
- Password: admin123

ADVANTAGES OF DOCKER DESKTOP:
✓ Port forwarding works perfectly (localhost just works)
✓ No complex network configuration needed
✓ User-friendly GUI dashboard
✓ Easy container monitoring
✓ Better Windows integration
✓ Simpler troubleshooting

TROUBLESHOOTING:

Issue: "Virtualization not enabled"
Solution: Enable virtualization in your BIOS settings
- Restart computer and enter BIOS (usually F2, F10, or Del key)
- Look for "Virtualization Technology" or "VT-x/AMD-V"
- Enable it and save changes

Issue: "WSL2 not installed"
Solution: The installer will attempt to enable it automatically
- If it fails, run in PowerShell as Admin:
  wsl --install
- Restart your computer
- Run the installer again

Issue: "Docker Desktop not starting"
Solution: 
1. Check if virtualization is enabled in BIOS
2. Restart your computer
3. Manually start Docker Desktop from Start Menu
4. Wait for it to fully start (green icon in system tray)
5. Run the IntelliQuiz launcher again

Issue: "Cannot access http://localhost:3000"
Solution: 
1. Check if Docker Desktop is running (green icon in system tray)
2. Open Docker Desktop dashboard
3. Verify all 3 containers are running (intelliquiz_db, intelliquiz_backend, intelliquiz_frontend)
4. If not, run: C:\IntelliQuiz\launch_intelliquiz.bat

MONITORING CONTAINERS:
- Open Docker Desktop dashboard to see all running containers
- View logs, resource usage, and container status
- Much easier than command-line tools!

UNINSTALLATION:
1. Run: C:\IntelliQuiz\cleanup.ps1
   OR
2. Use Windows "Add or Remove Programs"

Note: Your data is preserved in C:\IntelliQuiz\data even after uninstall

SUPPORT:
For issues or questions, contact your system administrator.

============================================================
