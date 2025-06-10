@echo off
echo Starting JammyChat Deployment Check...
echo.

echo Checking Node.js version...
node --version
echo.

echo Checking npm version...
npm --version
echo.

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo Frontend build completed successfully!
echo.

echo Deployment check completed successfully!
echo.
echo Next steps:
echo 1. Deploy backend to Render/Railway/Heroku
echo 2. Deploy frontend to Netlify
echo 3. Update environment variables in both platforms
echo.
pause
