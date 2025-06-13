@echo off
REM Kill any existing Node.js processes
taskkill /F /IM node.exe >nul 2>&1

echo Starting server on http://localhost:3000
cd C:\Users\Administrator\Downloads\Website\Website
echo Checking server.js file...
type server.js | find "app.put('/api/product/:id'"
if %errorlevel% neq 0 (
    echo WARNING: PUT endpoint for product updates may be missing!
)
echo Starting server with debug output...
node server.js
pause
