[Setup]
; Basic Setup Parameters
AppName=IntelliQuiz
AppVersion=1.0.0
AppCopyright=IntelliQuiz Production 2026
AppPublisher=IntelliQuiz Team
DefaultDirName=C:\IntelliQuiz
DefaultGroupName=IntelliQuiz
OutputBaseFilename=IntelliQuizzInstaller
OutputDir=.\output
ArchitecturesInstallIn64BitMode=x64
ArchitecturesAllowed=x64
PrivilegesRequired=admin
LicenseFile=LICENSE.txt
InfoBeforeFile=INSTALL_INFO.txt
UsePreviousAppDir=no
Uninstallable=yes
AllowNoIcons=yes

; MAXIMUM COMPRESSION SETTINGS - Reduces size by 40-50%
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
LZMADictionarySize=1048576
LZMANumFastBytes=273
LZMANumBlockThreads=2
InternalCompressLevel=ultra64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Dirs]
; Create data directories
Name: "{app}\data\postgres"; Flags: uninsneveruninstall
Name: "{app}\data\backups"; Flags: uninsneveruninstall
Name: "{app}\data\logs"; Flags: uninsneveruninstall
Name: "{app}\images"
Name: "{app}\docker"

[InstallDelete]
; Force delete old launcher before installing new one
Type: files; Name: "{app}\launch_intelliquiz.bat"
Type: files; Name: "{app}\scripts\load_images.ps1"
Type: files; Name: "{app}\scripts\setup.ps1"
Type: files; Name: "{app}\scripts\cleanup.ps1"
Type: files; Name: "{app}\scripts\install_docker.ps1"

[Files]
; Docker Compose Configuration
Source: "docker-compose.prod.yml"; DestDir: "{app}"; Flags: ignoreversion

; Main Launcher (ONE-CLICK EXECUTION) - ALWAYS OVERWRITE
Source: "launch_intelliquiz.bat"; DestDir: "{app}"; Flags: ignoreversion uninsneveruninstall

; PowerShell Scripts
Source: "scripts\setup.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "scripts\cleanup.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "scripts\install_docker.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "scripts\load_images.ps1"; DestDir: "{app}"; Flags: ignoreversion

; Docker Images (compressed .tar.gz files)
Source: "images\*.tar.gz"; DestDir: "{app}\images"; Flags: ignoreversion

; Docker Desktop Installer - Commented out (too large, users should install separately)
; Source: "docker\DockerDesktopInstaller.exe"; DestDir: "{app}\docker"; Flags: ignoreversion

; Documentation and Access Information
Source: "README.txt"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "ACCESS_INFO.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "LAN_ACCESS_GUIDE.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "TROUBLESHOOTING.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion

[Run]
; Install Docker Desktop and initialize
Filename: "powershell.exe"; \
    Parameters: "-ExecutionPolicy Bypass -NoProfile -File ""{app}\setup.ps1"""; \
    Flags: runhidden waituntilterminated; StatusMsg: "Setting up Docker Desktop..."

; Launch IntelliQuiz after installation
Filename: "{app}\launch_intelliquiz.bat"; \
    Flags: postinstall skipifsilent nowait; StatusMsg: "Starting IntelliQuiz..."; \
    Description: "Launch IntelliQuiz now"

[Icons]
; Desktop shortcut - ONE CLICK TO RUN
Name: "{commondesktop}\IntelliQuiz"; Filename: "{app}\launch_intelliquiz.bat"; \
    IconFilename: "{sys}\shell32.dll"; IconIndex: 1; WorkingDir: "{app}"; \
    Comment: "Start IntelliQuiz Application"

; Start Menu shortcuts
Name: "{group}\IntelliQuiz"; Filename: "{app}\launch_intelliquiz.bat"; \
    IconFilename: "{sys}\shell32.dll"; IconIndex: 1; WorkingDir: "{app}"

Name: "{group}\Cleanup"; Filename: "powershell.exe"; \
    Parameters: "-ExecutionPolicy Bypass -NoProfile -File ""{app}\cleanup.ps1"""; \
    IconFilename: "{sys}\shell32.dll"; IconIndex: 31; WorkingDir: "{app}"

[Tasks]
Name: "desktopicon"; Description: "Create a &Desktop shortcut"; \
    GroupDescription: "Additional tasks:"

[Code]
// System requirements check
function InitializeSetup(): Boolean;
begin
  Result := True;
  
  // Check Windows version (10/11 minimum)
  if not ((GetWindowsVersion >= $0A00)) then begin
    MsgBox('Windows 10 or later is required. You are running an older version.', mbError, MB_OK);
    Result := False;
  end;
end;

// Show access information after installation
procedure CurStepChanged(CurStep: TSetupStep);
var
  AccessInfoFile: String;
begin
  if CurStep = ssPostInstall then
  begin
    AccessInfoFile := ExpandConstant('{app}\ACCESS_INFO.txt');
    MsgBox('Installation complete!' + #13#10#13#10 + 
           'IMPORTANT: To share IntelliQuiz with participants:' + #13#10 +
           '1. Run IntelliQuiz from the desktop shortcut' + #13#10 +
           '2. The launcher will display the participant access URL' + #13#10 +
           '3. Share that URL with participants on the same network' + #13#10#13#10 +
           'Example: http://10.243.101.147:3000' + #13#10#13#10 +
           'See ACCESS_INFO.txt for detailed instructions.', 
           mbInformation, MB_OK);
  end;
end;

[UninstallDelete]
; Clean up but preserve user data
Type: files; Name: "{app}\setup.ps1"
Type: files; Name: "{app}\cleanup.ps1"
Type: files; Name: "{app}\docker-compose.prod.yml"
Type: filesandordirs; Name: "{app}\images"
Type: filesandordirs; Name: "{app}\docker"
; NOTE: {app}\data is preserved for user data

[CustomMessages]
english.SetupWindowTitle=IntelliQuiz Installer
english.WelcomeLabel1=Welcome to IntelliQuiz
english.WelcomeLabel2=This installer will set up IntelliQuiz on your computer.%n%nFeatures:%n- One-click startup%n- Automatic port conflict resolution%n- No manual configuration needed%n%nRequirements:%n- Windows 10/11 (64-bit)%n- 10GB free space%n- Virtualization enabled
