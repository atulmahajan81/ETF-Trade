@echo off
echo ========================================
echo    ETF Trading App - GitHub Upload
echo ========================================
echo.

echo Checking if Git is installed...
"C:\Program Files\Git\bin\git.exe" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo Please download and install Git from: https://git-scm.com/
    echo.
    pause
    exit /b 1
)

echo Git is installed. Proceeding with upload...
echo.

echo Step 1: Initializing Git repository...
"C:\Program Files\Git\bin\git.exe" init
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize Git repository
    pause
    exit /b 1
)

echo Step 2: Adding all files to Git...
"C:\Program Files\Git\bin\git.exe" add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files to Git
    pause
    exit /b 1
)

echo Step 3: Creating initial commit...
"C:\Program Files\Git\bin\git.exe" commit -m "Initial commit: ETF Trading Application with MStocks API integration"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create commit
    pause
    exit /b 1
)

echo Step 4: Adding remote repository...
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/atulmahajan81/ETF-Trade.git
if %errorlevel% neq 0 (
    echo ERROR: Failed to add remote repository
    pause
    exit /b 1
)

echo Step 5: Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push -u origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push to GitHub
    echo.
    echo Possible solutions:
    echo 1. Make sure you have access to the repository
    echo 2. Check your GitHub credentials
    echo 3. Try using GitHub CLI: gh auth login
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    SUCCESS! Project uploaded to GitHub
echo ========================================
echo.
echo Repository URL: https://github.com/atulmahajan81/ETF-Trade
echo.
echo Next steps:
echo 1. Visit the repository URL to verify upload
echo 2. Check README.md for setup instructions
echo 3. Consider setting up GitHub Pages or deployment
echo.
pause 