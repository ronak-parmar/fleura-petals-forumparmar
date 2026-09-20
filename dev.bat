@echo off
setlocal enabledelayedexpansion

rem ===========================================================================
rem  Fleurea Petals -- one-click dev launcher (Windows / double-click this file)
rem  Starts local Postgres (if set up), the ASP.NET Core backend, and the
rem  Next.js frontend -- each in its own window -- then opens Chrome to the
rem  frontend and the backend's Swagger UI once both are ready.
rem  Safe to re-run: skips anything already running, skips pieces that
rem  haven't been built yet (backend/Postgres) with a clear message.
rem ===========================================================================

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "PG_DIR=%ROOT%\database\pg"
set "BACKEND_DIR=%ROOT%\backend\src\Fleurea.Api"
set "FRONTEND_DIR=%ROOT%\app"

set "FE_PORT=3100"
set "BE_PORT=5080"
set "PG_PORT=55432"

rem This machine's nvm4w Node install on PATH is broken -- put the working one first.
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ===========================================
echo   Fleurea Petals -- dev launcher
echo ===========================================
echo.

rem ---------------------------------------------------------------------
rem 1. PostgreSQL (portable local cluster, if one has been set up)
rem ---------------------------------------------------------------------
if exist "%PG_DIR%\bin\pg_ctl.exe" (
    call :check_port !PG_PORT!
    if "!PORT_OPEN!"=="1" (
        echo [postgres]  already running on port !PG_PORT!
    ) else (
        echo [postgres]  starting on port !PG_PORT! ...
        start "Fleurea Postgres" /min cmd /c ""%PG_DIR%\bin\pg_ctl.exe" -D "%PG_DIR%\data" -l "%PG_DIR%\log.txt" -o "-p !PG_PORT!" start"
        timeout /t 3 /nobreak >nul
    )
) else (
    echo [postgres]  not set up yet -- skipping. See database\README.md
)
echo.

rem ---------------------------------------------------------------------
rem 2. Backend -- ASP.NET Core Web API
rem ---------------------------------------------------------------------
if exist "%BACKEND_DIR%\Fleurea.Api.csproj" (
    call :check_port !BE_PORT!
    if "!PORT_OPEN!"=="1" (
        echo [backend]   already running on http://localhost:!BE_PORT!
    ) else (
        echo [backend]   starting on http://localhost:!BE_PORT! ...
        start "Fleurea Backend" cmd /k cd /d "%BACKEND_DIR%" ^&^& dotnet run
    )
) else (
    echo [backend]   not built yet -- skipping.
)
echo.

rem ---------------------------------------------------------------------
rem 3. Frontend -- Next.js
rem ---------------------------------------------------------------------
call :check_port !FE_PORT!
if "!PORT_OPEN!"=="1" (
    echo [frontend]  already running on http://localhost:!FE_PORT!
) else (
    echo [frontend]  starting on http://localhost:!FE_PORT! ...
    start "Fleurea Frontend" cmd /k cd /d "%FRONTEND_DIR%" ^&^& npm run dev -- -p !FE_PORT!
)
echo.

rem ---------------------------------------------------------------------
rem 4. Wait for backend + frontend to be ready
rem ---------------------------------------------------------------------
echo Waiting for backend and frontend to come up ...
set /a TRIES=0
:waitloop
call :check_port !BE_PORT!
set "BE_UP=!PORT_OPEN!"
call :check_port !FE_PORT!
set "FE_UP=!PORT_OPEN!"
if "!BE_UP!"=="1" if "!FE_UP!"=="1" goto ready
set /a TRIES+=1
if !TRIES! GEQ 90 (
    echo.
    echo Timed out waiting -- check the Backend/Frontend windows for errors.
    goto ready
)
timeout /t 1 /nobreak >nul
goto waitloop

:ready
echo.

rem ---------------------------------------------------------------------
rem 5. Open Chrome: frontend + backend Swagger UI
rem ---------------------------------------------------------------------
set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME (
    echo Opening Chrome ...
    if "!FE_UP!"=="1" start "" "%CHROME%" "http://localhost:!FE_PORT!"
    if "!BE_UP!"=="1" start "" "%CHROME%" "http://localhost:!BE_PORT!/swagger"
) else (
    echo Chrome not found in the usual locations -- opening with the default browser instead.
    if "!FE_UP!"=="1" start "" "http://localhost:!FE_PORT!"
    if "!BE_UP!"=="1" start "" "http://localhost:!BE_PORT!/swagger"
)

echo.
echo ===========================================
echo  Frontend:  http://localhost:!FE_PORT!
echo  Backend:   http://localhost:!BE_PORT!/swagger
echo  Postgres:  localhost:!PG_PORT!
echo ===========================================
echo Backend and frontend are running in their own windows -- close
echo those windows (or Ctrl+C inside them) to stop them.
echo.
pause
exit /b 0

rem ===========================================================================
rem  :check_port <port>  -- sets PORT_OPEN=1 if something is listening, else 0
rem ===========================================================================
:check_port
set "PORT_OPEN=0"
netstat -ano | findstr /c:":%~1 " | findstr /c:"LISTENING" >nul 2>&1
if not errorlevel 1 set "PORT_OPEN=1"
exit /b 0
