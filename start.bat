@echo off
title Crypto Forecasting System
color 0A

echo.
echo =====================================================
echo    CRYPTO FORECASTING SYSTEM - STARTING UP...
echo =====================================================
echo.

:: Set project root to the folder where this bat file lives
set ROOT=%~dp0
cd /d "%ROOT%"

:: ─────────────────────────────────────────
:: STEP 1: Check Python
:: ─────────────────────────────────────────
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org
    pause
    exit /b 1
)
echo       OK

:: ─────────────────────────────────────────
:: STEP 2: Check Node / npm
:: ─────────────────────────────────────────
echo [2/5] Checking Node.js...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo       OK

:: ─────────────────────────────────────────
:: STEP 3: Install Python dependencies
:: ─────────────────────────────────────────
echo [3/5] Installing Python dependencies...
pip install requests APScheduler fastapi uvicorn numpy scikit-learn >nul 2>&1
echo       OK

:: ─────────────────────────────────────────
:: STEP 4: Install frontend dependencies
:: ─────────────────────────────────────────
echo [4/5] Installing frontend dependencies...
if not exist "%ROOT%frontend\node_modules" (
    echo       node_modules not found - running npm install (first time only)...
    cd /d "%ROOT%frontend"
    npm install >nul 2>&1
    cd /d "%ROOT%"
)
echo       OK

:: ─────────────────────────────────────────
:: STEP 5: Seed database
:: ─────────────────────────────────────────
echo [5/5] Seeding database with historical data...
python seed_data.py
echo       OK

echo.
echo =====================================================
echo    LAUNCHING ALL SERVICES...
echo =====================================================
echo.

:: ─────────────────────────────────────────
:: Launch Price Ingestion (background)
:: ─────────────────────────────────────────
echo [~] Starting Price Ingestion Service...
start "Crypto - Price Ingestion" /min cmd /k "cd /d "%ROOT%" && python run_simple.py"
timeout /t 2 >nul

:: ─────────────────────────────────────────
:: Launch FastAPI Backend (background)
:: ─────────────────────────────────────────
echo [~] Starting Backend API...
start "Crypto - Backend API" /min cmd /k "cd /d "%ROOT%" && python backend\app.py"
timeout /t 3 >nul

:: ─────────────────────────────────────────
:: Launch React Frontend (background)
:: ─────────────────────────────────────────
echo [~] Starting Frontend...
start "Crypto - Frontend" /min cmd /k "cd /d "%ROOT%frontend" && npm start"
timeout /t 5 >nul

:: ─────────────────────────────────────────
:: Open browser
:: ─────────────────────────────────────────
echo [~] Opening browser...
timeout /t 10 >nul
start http://localhost:3000

echo.
echo =====================================================
echo   ALL SERVICES RUNNING!
echo =====================================================
echo.
echo   Frontend   -^>  http://localhost:3000
echo   Backend    -^>  http://localhost:8000
echo   API Docs   -^>  http://localhost:8000/docs
echo.
echo   3 minimized terminals are running in the taskbar.
echo   Close them to stop the system.
echo.
echo =====================================================
pause
