@echo off
echo ========================================================
echo       Annual Party Website - Firewall Fix Tool
echo ========================================================
echo.
echo Checking for administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Administrator privileges confirmed.
) else (
    echo [ERROR] Current permissions inadequate.
    echo.
    echo ********************************************************
    echo PLEASE RIGHT-CLICK THIS FILE AND SELECT "RUN AS ADMINISTRATOR"
    echo ********************************************************
    echo.
    pause
    exit /b
)

echo.
echo Adding firewall rules...
echo --------------------------------------------------------

echo 1. Allowing Port 3001 (Backend/Socket)...
netsh advfirewall firewall add rule name="Annual Party Node (3001)" dir=in action=allow protocol=TCP localport=3001

echo.
echo 2. Allowing Port 5173 (Frontend/Vite)...
netsh advfirewall firewall add rule name="Annual Party Vite (5173)" dir=in action=allow protocol=TCP localport=5173

echo.
echo --------------------------------------------------------
echo [SUCCESS] Firewall rules added successfully!
echo.
echo Please try accessing the website on your phone again.
echo.
pause
