@echo off
title QuizArena - Iniciando...

:: ============================================================================
:: CONFIGURACION - CAMBIA AQUI TU IP
:: ============================================================================
set LOCAL_IP=192.168.1.20

echo ============================================================================
echo                      QuizArena - Script de Inicio
echo ============================================================================
echo.
echo [*] IP configurada: %LOCAL_IP%
echo.
echo Si esta NO es tu IP WiFi, editala en start.bat linea 7
echo.
pause

cd /d "%~dp0"

:: Matar procesos en puertos
echo [*] Liberando puertos...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do taskkill /F /PID %%a >nul 2>&1
echo [OK] Puertos liberados
echo.

:: Configurar .env.local
echo [*] Configurando frontend...
echo NEXT_PUBLIC_BACKEND_URL=http://%LOCAL_IP%:3001> frontend\.env.local
echo [OK] Frontend configurado con: http://%LOCAL_IP%:3001
echo.

:: Iniciar Backend
echo [*] Iniciando Backend...
start "Backend - http://%LOCAL_IP%:3001" cmd /k "cd backend && set SERVER_IP=%LOCAL_IP% && npm run dev"

timeout /t 2 /nobreak >nul

:: Iniciar Frontend
echo [*] Iniciando Frontend...
start "Frontend - http://%LOCAL_IP%:3000" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================================
echo                         QuizArena Iniciado!
echo ============================================================================
echo.
echo   Backend:  http://%LOCAL_IP%:3001
echo   Frontend: http://%LOCAL_IP%:3000
echo.
echo   El QR generara: http://%LOCAL_IP%:3000/join/CODIGO
echo.
echo ============================================================================
echo.

timeout /t 3 /nobreak >nul
start http://%LOCAL_IP%:3000

echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
