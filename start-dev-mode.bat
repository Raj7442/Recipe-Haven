@echo off
echo Starting Recipe Haven in Development Mode...
echo.
echo This will start both the React client (port 3000) and Express server (port 3002)
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting development servers...
echo Press Ctrl+C to stop both servers
echo.
echo ========================================
echo IMPORTANT: Make sure PostgreSQL is running!
echo ========================================
echo.

REM Start the Express server in background
echo Starting Express server on port 3002...
start "Express Server" cmd /k "node server.js"

REM Wait longer for server to initialize database
timeout /t 5 /nobreak > nul

REM Start the React development server
echo Starting React development server...
call npm run start-client