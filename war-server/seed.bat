@echo off
REM Database Seeding Quick Start Script (Windows)
REM This script helps you quickly seed the database with data from war-client/public

echo ========================================================
echo       WAR ROOM DATABASE SEEDING - QUICK START
echo ========================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Must be run from war-server directory
    echo Usage: cd war-server ^&^& seed.bat
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please create a .env file with your database credentials:
    echo.
    echo DB_HOST_DEV=localhost
    echo DB_PORT_DEV=3306
    echo DB_USER_DEV=your_username
    echo DB_PASSWORD_DEV=your_password
    echo DB_NAME=war_room_db
    echo.
    exit /b 1
)

REM Check if war-client/public folder exists
if not exist "..\war-client\public" (
    echo ERROR: war-client/public folder not found
    echo Expected path: ..\war-client\public
    exit /b 1
)

echo Pre-flight checks passed
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting database seeding...
echo.
echo WARNING: This will DELETE all existing data in the database!
echo Press Ctrl+C within 5 seconds to cancel...
echo.

timeout /t 5 /nobreak > nul

REM Run the seed script
call npm run seed

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo       DATABASE SEEDING COMPLETED
    echo ========================================================
    echo.
    echo Next steps:
    echo   1. Verify data: npm start
    echo   2. Check API endpoints
    echo   3. Test the application
) else (
    echo.
    echo ========================================================
    echo       DATABASE SEEDING FAILED
    echo ========================================================
    echo.
    echo Troubleshooting:
    echo   1. Check your .env file credentials
    echo   2. Ensure MySQL is running
    echo   3. Review error messages above
    echo   4. See SEEDING_GUIDE.md for details
    exit /b 1
)
