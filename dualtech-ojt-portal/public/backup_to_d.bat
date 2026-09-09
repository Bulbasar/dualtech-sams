@echo off
setlocal
set "SOURCE=C:\Users\rober\dualtech-ojt-portal"
set "DEST=D:\dualtech-ojt-portal"
set "LOGFILE=D:\dualtech-backup.log"

echo ============================================================================== >> "%LOGFILE%"
echo [%date% %time%] Starting Dualtech OJT Portal Backup to %DEST%... >> "%LOGFILE%"

robocopy "%SOURCE%" "%DEST%" /MIR /MT:16 /R:2 /W:5 /XJ /NP /LOG+:"%LOGFILE%"

if %ERRORLEVEL% LEQ 7 (
    echo [%date% %time%] Backup finished successfully with Robocopy status code %ERRORLEVEL%. >> "%LOGFILE%"
    exit /b 0
) else (
    echo [%date% %time%] WARNING: Backup completed with Robocopy error code %ERRORLEVEL%. >> "%LOGFILE%"
    exit /b %ERRORLEVEL%
)
