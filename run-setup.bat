@echo off
echo 🚀 NOVA Database Quick Setup
echo ============================
echo.
echo This will set up the complete NOVA database with test data.
echo Password required: (leave empty if no password set)
echo.
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\17\pgAdmin 4\runtime\psql.exe" -U postgres -h localhost -f quick-setup.sql
echo.
echo ✅ Setup complete! You can now run:
echo    npm run dev
echo.
pause