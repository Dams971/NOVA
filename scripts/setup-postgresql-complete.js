#!/usr/bin/env node

/**
 * NOVA PostgreSQL Database Setup Script
 * Complete setup for local development database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nova_db',
  user: process.env.DB_USER || 'nova_user',
  password: process.env.DB_PASSWORD || 'nova_password_2024'
};

async function executeQuery(client, query, suppressError = false) {
  try {
    const result = await client.query(query);
    return result;
  } catch (error) {
    if (!suppressError) {
      throw error;
    }
    return null;
  }
}

async function checkPostgreSQL() {
  log('\n📊 Step 1: Checking PostgreSQL connection...', colors.cyan);
  
  const client = new Client({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    log('✅ Connected to PostgreSQL server', colors.green);
    
    // Check PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    log(`   PostgreSQL: ${versionResult.rows[0].version.split(',')[0]}`, colors.yellow);
    
    await client.end();
    return true;
  } catch (error) {
    log(`❌ Cannot connect to PostgreSQL: ${error.message}`, colors.red);
    log('\nTroubleshooting:', colors.yellow);
    log('1. Ensure PostgreSQL is installed', colors.yellow);
    log('2. Start PostgreSQL service:', colors.yellow);
    log('   Windows: net start postgresql-x64-17', colors.yellow);
    log('   Mac: brew services start postgresql', colors.yellow);
    log('   Linux: sudo systemctl start postgresql', colors.yellow);
    log('3. Set POSTGRES_PASSWORD env variable if needed', colors.yellow);
    return false;
  }
}

async function createDatabase() {
  log('\n📦 Step 2: Creating database and user...', colors.cyan);
  
  const client = new Client({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Check if database exists
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${DB_CONFIG.database}'`
    );
    
    if (dbCheck.rows.length === 0) {
      await client.query(`CREATE DATABASE ${DB_CONFIG.database}`);
      log(`✅ Created database: ${DB_CONFIG.database}`, colors.green);
    } else {
      log(`✅ Database already exists: ${DB_CONFIG.database}`, colors.green);
    }
    
    // Check if user exists
    const userCheck = await client.query(
      `SELECT 1 FROM pg_user WHERE usename = '${DB_CONFIG.user}'`
    );
    
    if (userCheck.rows.length === 0) {
      await client.query(`CREATE USER ${DB_CONFIG.user} WITH PASSWORD '${DB_CONFIG.password}'`);
      log(`✅ Created user: ${DB_CONFIG.user}`, colors.green);
    } else {
      log(`✅ User already exists: ${DB_CONFIG.user}`, colors.green);
      // Update password just in case
      await client.query(`ALTER USER ${DB_CONFIG.user} WITH PASSWORD '${DB_CONFIG.password}'`);
    }
    
    // Grant privileges
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB_CONFIG.database} TO ${DB_CONFIG.user}`);
    await client.query(`ALTER DATABASE ${DB_CONFIG.database} OWNER TO ${DB_CONFIG.user}`);
    log('✅ Privileges granted', colors.green);
    
    await client.end();
    return true;
  } catch (error) {
    log(`❌ Database setup failed: ${error.message}`, colors.red);
    await client.end();
    return false;
  }
}

async function createSchema() {
  log('\n🏗️ Step 3: Creating database schema...', colors.cyan);
  
  const client = new Client({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  });

  try {
    await client.connect();
    
    // Enable extensions
    log('   Installing extensions...', colors.yellow);
    await executeQuery(client, `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`, true);
    await executeQuery(client, `CREATE EXTENSION IF NOT EXISTS "pg_trgm"`, true);
    await executeQuery(client, `CREATE EXTENSION IF NOT EXISTS "btree_gin"`, true);
    log('   ✅ Extensions installed', colors.green);
    
    // Create enum types
    log('   Creating enum types...', colors.yellow);
    await executeQuery(client, `
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('super_admin', 'cabinet_admin', 'practitioner', 'secretary', 'patient');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await executeQuery(client, `
      DO $$ BEGIN
        CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await executeQuery(client, `
      DO $$ BEGIN
        CREATE TYPE email_job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await executeQuery(client, `
      DO $$ BEGIN
        CREATE TYPE email_job_type AS ENUM ('appointment_confirmation', 'appointment_reminder', 'appointment_cancellation', 'appointment_reschedule');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    log('   ✅ Enum types created', colors.green);
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', 'setup-postgresql.sql');
    if (fs.existsSync(schemaPath)) {
      log('   Reading schema file...', colors.yellow);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Extract CREATE TABLE statements
      const tableStatements = schemaSql.match(/CREATE TABLE[^;]+;/gs) || [];
      
      for (const statement of tableStatements) {
        const tableNameMatch = statement.match(/CREATE TABLE\s+(\w+)/);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          
          // Check if table exists
          const tableCheck = await client.query(
            `SELECT 1 FROM information_schema.tables WHERE table_name = '${tableName}'`
          );
          
          if (tableCheck.rows.length === 0) {
            await client.query(statement);
            log(`   ✅ Created table: ${tableName}`, colors.green);
          }
        }
      }
      
      // Create indexes
      const indexStatements = schemaSql.match(/CREATE INDEX[^;]+;/gs) || [];
      for (const statement of indexStatements) {
        await executeQuery(client, statement, true);
      }
      log('   ✅ Indexes created', colors.green);
      
      // Create functions and triggers
      await executeQuery(client, `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
      log('   ✅ Functions created', colors.green);
    }
    
    await client.end();
    return true;
  } catch (error) {
    log(`❌ Schema creation failed: ${error.message}`, colors.red);
    await client.end();
    return false;
  }
}

async function seedData() {
  log('\n🌱 Step 4: Seeding test data...', colors.cyan);
  
  const client = new Client({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  });

  try {
    await client.connect();
    
    // Check if data already exists
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (userCount.rows[0].count > 0) {
      log('⚠️  Data already exists. Skipping seed.', colors.yellow);
      await client.end();
      return true;
    }
    
    // Hash password for test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Insert test cabinet
    await client.query(`
      INSERT INTO cabinets (id, name, address, city, postal_code, phone, email, website, business_hours)
      VALUES (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        'Cabinet Dentaire Centre-Ville',
        '123 Rue de la Paix',
        'Paris',
        '75001',
        '+33 1 42 86 83 00',
        'contact@cabinet-dentaire-cv.fr',
        'https://cabinet-dentaire-cv.fr',
        '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}}'::jsonb
      )
    `);
    log('   ✅ Created test cabinet', colors.green);
    
    // Insert test users
    await client.query(`
      INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, email_verified)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'admin@cabinet-dentaire-cv.fr', $1, 'cabinet_admin', 'Marie', 'Dubois', '+33 6 12 34 56 78', true),
        ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'dr.martin@cabinet-dentaire-cv.fr', $1, 'practitioner', 'Pierre', 'Martin', '+33 6 23 45 67 89', true),
        ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'dr.lefebvre@cabinet-dentaire-cv.fr', $1, 'practitioner', 'Sophie', 'Lefebvre', '+33 6 34 56 78 90', true),
        ('550e8400-e29b-41d4-a716-446655440012'::uuid, 'patient.test@example.com', $1, 'patient', 'Jean', 'Dupont', '+33 6 45 67 89 01', true)
    `, [hashedPassword]);
    log('   ✅ Created test users', colors.green);
    
    // Insert practitioners
    await client.query(`
      INSERT INTO practitioners (id, user_id, cabinet_id, specialty, consultation_duration)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Dentisterie générale', 30),
        ('550e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Orthodontie', 45)
    `);
    log('   ✅ Created practitioners', colors.green);
    
    // Insert services
    await client.query(`
      INSERT INTO services (id, cabinet_id, name, description, duration, price, color)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Consultation de contrôle', 'Examen dentaire de routine', 30, 80.00, '#22c55e'),
        ('550e8400-e29b-41d4-a716-446655440008'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Détartrage', 'Nettoyage professionnel', 45, 120.00, '#3b82f6'),
        ('550e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Urgence dentaire', 'Consultation d''urgence', 30, 120.00, '#ef4444')
    `);
    log('   ✅ Created services', colors.green);
    
    await client.end();
    return true;
  } catch (error) {
    log(`❌ Seeding failed: ${error.message}`, colors.red);
    await client.end();
    return false;
  }
}

async function testConnection() {
  log('\n🧪 Step 5: Testing connection...', colors.cyan);
  
  const client = new Client({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  });

  try {
    await client.connect();
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    log(`✅ Connection successful! Server time: ${result.rows[0].current_time}`, colors.green);
    
    // Get counts
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM cabinets) as cabinets,
        (SELECT COUNT(*) FROM services) as services
    `);
    
    log('\n📊 Database Summary:', colors.cyan);
    log(`   Users: ${counts.rows[0].users}`, colors.yellow);
    log(`   Cabinets: ${counts.rows[0].cabinets}`, colors.yellow);
    log(`   Services: ${counts.rows[0].services}`, colors.yellow);
    
    await client.end();
    return true;
  } catch (error) {
    log(`❌ Connection test failed: ${error.message}`, colors.red);
    await client.end();
    return false;
  }
}

async function main() {
  log('\n🚀 NOVA PostgreSQL Setup', colors.bright + colors.blue);
  log('========================', colors.blue);
  
  const testOnly = process.argv.includes('--test-only');
  
  if (testOnly) {
    await testConnection();
    process.exit(0);
  }
  
  // Run all steps
  const steps = [
    checkPostgreSQL,
    createDatabase,
    createSchema,
    seedData,
    testConnection
  ];
  
  for (const step of steps) {
    const success = await step();
    if (!success) {
      log('\n❌ Setup failed. Please fix the errors and try again.', colors.red);
      process.exit(1);
    }
  }
  
  // Success!
  log('\n✨ NOVA PostgreSQL setup completed successfully!', colors.bright + colors.green);
  log('\n📋 Test Credentials:', colors.cyan);
  log('   Admin: admin@cabinet-dentaire-cv.fr / password123', colors.yellow);
  log('   Doctor: dr.martin@cabinet-dentaire-cv.fr / password123', colors.yellow);
  log('   Patient: patient.test@example.com / password123', colors.yellow);
  
  log('\n🎯 Next Steps:', colors.cyan);
  log('   1. Start the app: npm run dev', colors.yellow);
  log('   2. Visit: http://localhost:3000', colors.yellow);
  log('   3. Start WebSocket: npm run websocket', colors.yellow);
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

// Run setup
main();