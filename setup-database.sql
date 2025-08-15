-- Nova Database Setup Script
-- Execute this script in MySQL to create the database and user

-- Create database
CREATE DATABASE IF NOT EXISTS nova_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional - you can use root if you prefer)
CREATE USER IF NOT EXISTS 'nova_user'@'localhost' IDENTIFIED BY 'nova_password_2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON nova_db.* TO 'nova_user'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE nova_db;

-- Show confirmation
SELECT 'Nova database created successfully!' as message;
