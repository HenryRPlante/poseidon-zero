@echo off
REM Arduino to Ionic Bridge - Windows Setup
REM Double-click this file to start sending Arduino data to Ionic app

echo.
echo ======================================================================
echo Arduino to Ionic Bridge - Windows
echo ======================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python from https://www.python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Installing required packages...
pip install -q pyserial requests

echo.
set "FLASK_URL=https://organic-cod-r46r56949rvjf5qwx-5000.app.github.dev/api/sensors"
set /p IONIC_URL_INPUT=Paste your Ionic URL (optional, e.g. https://<name>-8101.app.github.dev): 

if not "%IONIC_URL_INPUT%"=="" (
    for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$u=$env:IONIC_URL_INPUT.Trim(); if(-not $u){ exit 1 }; if($u -notmatch '^https?://'){ $u='https://'+$u }; $uri=[uri]$u; $host=$uri.Host -replace '-8101','-5000' -replace '-8100','-5000'; Write-Output ($uri.Scheme + '://' + $host + '/api/sensors')"`) do set "FLASK_URL=%%i"
)

echo Using Flask endpoint: %FLASK_URL%

echo.
echo Starting Arduino reader...
echo.

python arduino_to_ionic.py

pause
