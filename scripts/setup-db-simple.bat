@echo off
REM NOVA PostgreSQL Database Setup Script for Windows
REM Simple batch script to create database and user

echo.
echo NOVA PostgreSQL Database Setup
echo ==============================
echo.

set PGPATH=C:\Program Files\PostgreSQL\17\bin
set PGPASSWORD=postgres
set DBNAME=nova_db
set DBUSER=nova_user
set DBPASS=nova_password_2024

echo Checking PostgreSQL installation...
"%PGPATH%\psql" --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL not found at %PGPATH%
    echo Please install PostgreSQL or update the path
    exit /b 1
)
echo PostgreSQL found.

echo.
echo Creating database %DBNAME%...
"%PGPATH%\psql" -U postgres -c "CREATE DATABASE %DBNAME%;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Database created successfully.
) else (
    echo Database already exists or error occurred.
)

echo.
echo Creating user %DBUSER%...
"%PGPATH%\psql" -U postgres -c "CREATE USER %DBUSER% WITH PASSWORD '%DBPASS%';" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo User created successfully.
) else (
    echo User already exists or error occurred.
)

echo.
echo Granting privileges...
"%PGPATH%\psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DBNAME% TO %DBUSER%;" >nul 2>&1
"%PGPATH%\psql" -U postgres -c "ALTER DATABASE %DBNAME% OWNER TO %DBUSER%;" >nul 2>&1
echo Privileges granted.

echo.
echo Creating extensions...
"%PGPATH%\psql" -U postgres -d %DBNAME% -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;" >nul 2>&1
"%PGPATH%\psql" -U postgres -d %DBNAME% -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" >nul 2>&1
echo Extensions created.

echo.
echo Testing connection...
set PGPASSWORD=%DBPASS%
"%PGPATH%\psql" -U %DBUSER% -d %DBNAME% -c "SELECT 'Connection successful' as status;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Connection test PASSED!
    echo.
    echo Database Information:
    echo   Host: localhost
    echo   Port: 5432
    echo   Database: %DBNAME%
    echo   User: %DBUSER%
    echo   Password: %DBPASS%
) else (
    echo Connection test FAILED!
    echo Please check your PostgreSQL installation.
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Run migrations: node scripts/run-migrations.js
echo 2. Start the app: npm run dev
echo 3. Start WebSocket: npm run websocket
echo.
pause