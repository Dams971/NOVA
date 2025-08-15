# NOVA PostgreSQL Setup Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "🚀 NOVA PostgreSQL Database Setup for Windows" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$pgPath = "C:\Program Files\PostgreSQL\17\bin"
$dbName = "nova_db"
$dbUser = "nova_user"
$dbPassword = "nova_password_2024"

# Add PostgreSQL to PATH if not already there
if (-not ($env:Path -like "*PostgreSQL*")) {
    Write-Host "Adding PostgreSQL to PATH..." -ForegroundColor Yellow
    $env:Path = $env:Path + ";" + $pgPath
}

# Function to run psql commands
function Run-PsqlCommand {
    param(
        [string]$Command,
        [string]$Database = "postgres",
        [string]$User = "postgres"
    )
    
    $env:PGPASSWORD = "postgres"
    $result = & "$pgPath\psql.exe" -U $User -d $Database -c $Command 2>&1
    return $result
}

# Check PostgreSQL service
Write-Host "🔍 Checking PostgreSQL service..." -ForegroundColor Yellow
$service = Get-Service -Name "postgresql-x64-17" -ErrorAction SilentlyContinue
if ($service.Status -eq "Running") {
    Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL service is not running. Starting..." -ForegroundColor Yellow
    Start-Service -Name "postgresql-x64-17"
    Start-Sleep -Seconds 3
}

# Create database
Write-Host ""
Write-Host "📦 Creating database..." -ForegroundColor Yellow
$checkDb = Run-PsqlCommand -Command "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
if ($checkDb -notlike "*1 row*") {
    $result = Run-PsqlCommand -Command "CREATE DATABASE $dbName"
    if ($result -like "*CREATE DATABASE*") {
        Write-Host "✅ Database '$dbName' created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database might already exist or error occurred" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Database '$dbName' already exists" -ForegroundColor Green
}

# Create user
Write-Host "👤 Creating user..." -ForegroundColor Yellow
$checkUser = Run-PsqlCommand -Command "SELECT 1 FROM pg_user WHERE usename = '$dbUser'"
if ($checkUser -notlike "*1 row*") {
    $result = Run-PsqlCommand -Command "CREATE USER $dbUser WITH PASSWORD '$dbPassword'"
    if ($result -like "*CREATE ROLE*") {
        Write-Host "✅ User '$dbUser' created successfully" -ForegroundColor Green
    }
} else {
    Write-Host "✅ User '$dbUser' already exists" -ForegroundColor Green
    # Update password
    Run-PsqlCommand -Command "ALTER USER $dbUser WITH PASSWORD '$dbPassword'"
}

# Grant privileges
Write-Host "🔑 Granting privileges..." -ForegroundColor Yellow
Run-PsqlCommand -Command "GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser"
Run-PsqlCommand -Command "ALTER DATABASE $dbName OWNER TO $dbUser"
Write-Host "✅ Privileges granted" -ForegroundColor Green

# Switch to nova_db and grant schema privileges
Write-Host "🔧 Setting up schema privileges..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPassword
& "$pgPath\psql.exe" -U $dbUser -d $dbName -c "GRANT ALL ON SCHEMA public TO $dbUser" 2>&1 | Out-Null

# Create extensions
Write-Host "📦 Creating extensions..." -ForegroundColor Yellow
$extensions = @("uuid-ossp", "pgcrypto")
foreach ($ext in $extensions) {
    $env:PGPASSWORD = "postgres"
    & "$pgPath\psql.exe" -U postgres -d $dbName -c "CREATE EXTENSION IF NOT EXISTS `"$ext`"" 2>&1 | Out-Null
}
Write-Host "✅ Extensions created" -ForegroundColor Green

# Test connection
Write-Host ""
Write-Host "🧪 Testing connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPassword
$testResult = & "$pgPath\psql.exe" -U $dbUser -d $dbName -c "SELECT current_database(), current_user, version()" 2>&1
if ($testResult -like "*PostgreSQL*") {
    Write-Host "✅ Connection successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Database Information:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: 5432" -ForegroundColor White
    Write-Host "  Database: $dbName" -ForegroundColor White
    Write-Host "  User: $dbUser" -ForegroundColor White
    Write-Host "  Password: $dbPassword" -ForegroundColor White
} else {
    Write-Host "❌ Connection test failed" -ForegroundColor Red
    Write-Host $testResult
}

Write-Host ""
Write-Host "🎉 PostgreSQL setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run database migrations: npm run migrate" -ForegroundColor Yellow
Write-Host "2. Start the application: npm run dev" -ForegroundColor Yellow
Write-Host "3. Start WebSocket server: npm run websocket" -ForegroundColor Yellow