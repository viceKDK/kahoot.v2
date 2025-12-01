@echo off
chcp 65001 >nul
title QuizArena - Iniciando...

echo ============================================================================
echo                      QuizArena - Script de Inicio
echo ============================================================================
echo.

cd /d "%~dp0"

:: ============================================================================
:: Matar procesos que ocupan los puertos 3000 y 3001
:: ============================================================================
echo [*] Verificando puertos en uso...

:: Matar proceso en puerto 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    if not "%%a"=="" (
        echo [!] Puerto 3000 en uso ^(PID: %%a^). Matando proceso...
        taskkill /F /PID %%a >nul 2>&1
        echo [OK] Proceso en puerto 3000 terminado
    )
)

:: Matar proceso en puerto 3001 (Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    if not "%%a"=="" (
        echo [!] Puerto 3001 en uso ^(PID: %%a^). Matando proceso...
        taskkill /F /PID %%a >nul 2>&1
        echo [OK] Proceso en puerto 3001 terminado
    )
)

echo [OK] Puertos verificados
echo.

:: ============================================================================
:: Iniciar Backend y Frontend
:: ============================================================================
echo [*] Iniciando Backend...
start "QuizArena Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Esperar 2 segundos antes de iniciar frontend
timeout /t 2 /nobreak >nul

echo [*] Iniciando Frontend...
start "QuizArena Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: ============================================================================
:: Mensaje final
:: ============================================================================
echo.
echo ============================================================================
echo                         QuizArena Iniciado!
echo ============================================================================
echo.
echo   Backend:  http://localhost:3001  (o http://192.168.1.98:3001)
echo   Frontend: http://localhost:3000  (o http://192.168.1.98:3000)
echo.
echo   Para cerrar, cierra las ventanas de terminal abiertas.
echo ============================================================================
echo.
pause
