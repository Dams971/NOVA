#!/usr/bin/env node

/**
 * NOVA PostgreSQL Database Setup Script
 * Automated setup for local development database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function checkPostgreSQL() {
  log('\n📊 Checking PostgreSQL connection...', colors.cyan);
  
  // Try default postgres credentials first
  let postgresPassword = process.env.POSTGRES_PASSWORD || 'postgres';
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: postgresPassword,
    database: 'postgres'
  });

  try {
      execSync(`psql -U postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"`, { stdio: 'pipe' });
      console.log(`✅ User '${DB_USER}' created`);
    } catch (error) {
      if (error.toString().includes('already exists')) {
        console.log(`⚠️ User '${DB_USER}' already exists, skipping`);
      } else {
        throw error;
      }
    }
    
    // Create database
    console.log('🗄️ Creating database...');
    try {
      execSync(`psql -U postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"`, { stdio: 'pipe' });
      console.log(`✅ Database '${DB_NAME}' created`);
    } catch (error) {
      if (error.toString().includes('already exists')) {
        console.log(`⚠️ Database '${DB_NAME}' already exists, skipping`);
      } else {
        throw error;
      }
    }
    
    // Grant privileges
    console.log('🔑 Granting privileges...');
    execSync(`psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"`, { stdio: 'pipe' });
    execSync(`psql -U postgres -c "ALTER USER ${DB_USER} CREATEDB;"`, { stdio: 'pipe' });
    console.log('✅ Privileges granted');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to setup database:', error.message);
    return false;
  }
}

// Run SQL schema setup
function runSchemaSetup() {
  try {
    console.log('');
    console.log('📋 Setting up database schema...');
    
    const schemaPath = path.join(__dirname, '..', 'setup-postgresql.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return false;
    }
    
    // Run schema setup
    execSync(`psql -U ${DB_USER} -d ${DB_NAME} -f "${schemaPath}"`, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PGPASSWORD: DB_PASSWORD }
    });
    console.log('✅ Database schema created');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to setup schema:', error.message);
    return false;
  }
}

// Run seed data
function runSeedData() {
  try {
    console.log('');
    console.log('🌱 Seeding initial data...');
    
    const seedPath = path.join(__dirname, '..', 'seed-data.sql');
    if (!fs.existsSync(seedPath)) {
      console.error('❌ Seed file not found:', seedPath);
      return false;
    }
    
    // Run seed data
    execSync(`psql -U ${DB_USER} -d ${DB_NAME} -f "${seedPath}"`, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PGPASSWORD: DB_PASSWORD }
    });
    console.log('✅ Seed data inserted');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to seed data:', error.message);
    return false;
  }
}

// Test connection
function testConnection() {
  try {
    console.log('');
    console.log('🧪 Testing database connection...');
    
    execSync(`psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT 'Database connection successful!' as message;"`, {
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: DB_PASSWORD }
    });
    
    console.log('✅ Database connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Display final instructions
function showFinalInstructions() {
  console.log('');
  console.log('🎉 NOVA Database Setup Complete!');
  console.log('===============================');
  console.log('');
  console.log('Database Information:');
  console.log(`  Host: localhost`);
  console.log(`  Port: 5432`);
  console.log(`  Database: ${DB_NAME}`);
  console.log(`  User: ${DB_USER}`);
  console.log(`  Password: ${DB_PASSWORD}`);
  console.log('');
  console.log('Test Users Created:');
  console.log('  - admin@cabinet-dentaire-cv.fr (cabinet admin)');
  console.log('  - dr.martin@cabinet-dentaire-cv.fr (practitioner)'); 
  console.log('  - dr.lefebvre@cabinet-dentaire-cv.fr (practitioner)');
  console.log('  - patient.test@example.com (patient)');
  console.log('');
  console.log('Default password for all test users: password123');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Start your Next.js application: npm run dev');
  console.log('2. Visit: http://localhost:3000');
  console.log('3. Provide SMTP credentials when ready for email features');
  console.log('');
  console.log('🔧 To connect manually:');
  console.log(`psql -U ${DB_USER} -d ${DB_NAME} -h localhost`);
}

// Main execution
async function main() {
  try {
    // Step 1: Check PostgreSQL
    if (!checkPostgreSQL()) {
      process.exit(1);
    }
    
    // Step 2: Setup database and user
    if (!setupDatabase()) {
      process.exit(1);
    }
    
    // Step 3: Run schema setup
    if (!runSchemaSetup()) {
      process.exit(1);
    }
    
    // Step 4: Run seed data
    if (!runSeedData()) {
      console.log('⚠️ Seed data failed, but schema is ready');
    }
    
    // Step 5: Test connection
    if (!testConnection()) {
      console.log('⚠️ Connection test failed, but database may still work');
    }
    
    // Step 6: Show final instructions
    showFinalInstructions();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('NOVA PostgreSQL Database Setup');
  console.log('');
  console.log('Usage: node scripts/setup-postgresql.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --test-only    Only test the connection');
  console.log('');
  process.exit(0);
}

if (process.argv.includes('--test-only')) {
  console.log('🧪 Testing database connection only...');
  testConnection();
  process.exit(0);
}

// Run main setup
main();