@echo off
REM Copy Public Assets from war-client to war-front
REM This batch file copies all necessary public assets from the Next.js app to the React app

echo Starting to copy public assets from war-client to war-front...

REM Define source and destination
set SOURCE=..\war-client\public
set DEST=.\public

REM Check if source exists
if not exist "%SOURCE%" (
    echo Error: Source directory %SOURCE% not found
    echo Make sure you're running this script from the war-front directory
    exit /b 1
)

REM Create destination if it doesn't exist
if not exist "%DEST%" mkdir "%DEST%"

echo Copying analytics data and tiles...
xcopy /E /I /Y "%SOURCE%\analytics" "%DEST%\analytics"

echo Copying charity images and data...
xcopy /E /I /Y "%SOURCE%\charities" "%DEST%\charities"

echo Copying common assets (fonts, network)...
xcopy /E /I /Y "%SOURCE%\common" "%DEST%\common"

echo Copying lesson content and images...
xcopy /E /I /Y "%SOURCE%\lesson" "%DEST%\lesson"

echo Copying warroom data...
xcopy /E /I /Y "%SOURCE%\warroom" "%DEST%\warroom"

echo Copying about images...
if exist "%SOURCE%\about" (
    xcopy /E /I /Y "%SOURCE%\about" "%DEST%\about"
)

echo.
echo All public assets copied successfully!
echo.
echo Summary of copied folders:
echo   - analytics/ (map tiles and data)
echo   - charities/ (images and data)
echo   - common/ (fonts and network images)
echo   - lesson/ (images and data)
echo   - warroom/ (data)
echo.
echo Done! Your war-front/public folder is ready.
pause
