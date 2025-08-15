@echo off
echo 🚀 NOVA Manual Database Setup for Windows
echo ==========================================

echo.
echo Step 1: Creating user and database...
echo Please enter password 'root' when prompted:
psql -U postgres -h localhost -c "CREATE USER nova_user WITH PASSWORD 'nova_password_2024';" 2>nul
psql -U postgres -h localhost -c "CREATE DATABASE nova_db OWNER nova_user;" 2>nul
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE nova_db TO nova_user;" 2>nul
psql -U postgres -h localhost -c "ALTER USER nova_user CREATEDB;" 2>nul

echo.
echo Step 2: Setting up database schema...
echo Please enter password 'nova_password_2024' when prompted:
set PGPASSWORD=nova_password_2024
psql -U nova_user -d nova_db -h localhost -f setup-postgresql.sql

echo.
echo Step 3: Adding seed data...
psql -U nova_user -d nova_db -h localhost -f seed-data.sql

echo.
echo ✅ NOVA Database Setup Complete!
echo.
echo Database Information:
echo   Host: localhost
echo   Port: 5432
echo   Database: nova_db
echo   User: nova_user
echo   Password: nova_password_2024
echo.
echo Test Users Created:
echo   - admin@cabinet-dentaire-cv.fr (password: password123)
echo   - dr.martin@cabinet-dentaire-cv.fr (password: password123)
echo   - patient.test@example.com (password: password123)
echo.
echo Next: Run 'npm run dev' to start the application!
echo.

pause