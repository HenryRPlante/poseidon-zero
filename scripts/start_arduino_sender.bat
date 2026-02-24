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
echo Starting Arduino reader...
echo.

python arduino_to_ionic.py

pause
