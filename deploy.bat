@echo off
chcp 65001 >nul
echo 🚀 ETF Trading App - Python-Free Deployment
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Build the application
echo 🔨 Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully

REM Check if build folder exists
if not exist "build" (
    echo ❌ Build folder not found
    pause
    exit /b 1
)

echo 📁 Build folder created: build\

REM Ask user for deployment option
echo.
echo 🎯 Choose deployment option:
echo 1. Vercel (Recommended - Free, Easy)
echo 2. Netlify (Free, Drag ^& Drop)
echo 3. GitHub Pages (Free, Git-based)
echo 4. Local testing only
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo 🚀 Deploying to Vercel...
    call npm install -g vercel
    call vercel --prod
) else if "%choice%"=="2" (
    echo 🚀 Ready for Netlify deployment!
    echo 📁 Upload the 'build' folder to Netlify
    echo 🌐 Visit: https://app.netlify.com/
    echo 📋 Drag and drop the 'build' folder to deploy
    pause
) else if "%choice%"=="3" (
    echo 🚀 Deploying to GitHub Pages...
    call npm install --save-dev gh-pages
    call npm run deploy:github
) else if "%choice%"=="4" (
    echo 🧪 Testing locally...
    call npx serve -s build
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment completed!
echo 📊 Your ETF Trading App is now live without Python dependencies!
echo.
echo 🔧 Features available:
echo ✅ Real-time price fetching (MStocks API)
echo ✅ Session management (localStorage)
echo ✅ DMA calculations (JavaScript)
echo ✅ Multi-broker support
echo ✅ Demo mode
echo ✅ User management
echo ✅ Trading interface
echo ✅ Data import/export
echo.
echo 🚀 Happy Trading! 📈
pause
