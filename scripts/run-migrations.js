#!/usr/bin/env node

/**
 * NOVA Database Migration Runner
 * Executes SQL migrations to set up database schema
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nova_db',
  user: process.env.DB_USER || 'nova_user',
  password: process.env.DB_PASSWORD || 'nova_password_2024'
};

console.log('\n🚀 NOVA Database Migration Runner');
console.log('==================================\n');

async function runMigrations() {
  const client = new Client(config);
  
  try {
    console.log('📊 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Create extensions
    console.log('📦 Creating extensions...');
    const extensions = ['uuid-ossp', 'pgcrypto'];
    for (const ext of extensions) {
      try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
        console.log(`  ✅ Extension ${ext} ready`);
      } catch (err) {
        console.log(`  ⚠️ Extension ${ext}: ${err.message}`);
      }
    }
    
    // Create enum types
    console.log('\n📋 Creating enum types...');
    const enums = [
      `CREATE TYPE user_role AS ENUM ('super_admin', 'cabinet_admin', 'practitioner', 'secretary', 'patient')`,
      `CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')`,
      `CREATE TYPE email_job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled')`,
      `CREATE TYPE email_job_type AS ENUM ('appointment_confirmation', 'appointment_reminder', 'appointment_cancellation', 'appointment_reschedule')`
    ];
    
    for (const enumSql of enums) {
      try {
        await client.query(enumSql);
        const typeName = enumSql.match(/CREATE TYPE (\w+)/)[1];
        console.log(`  ✅ Type ${typeName} created`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          const typeName = enumSql.match(/CREATE TYPE (\w+)/)[1];
          console.log(`  ✅ Type ${typeName} already exists`);
        } else {
          console.log(`  ❌ Error: ${err.message}`);
        }
      }
    }
    
    // Create tables
    console.log('\n🏗️ Creating tables...');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role user_role NOT NULL DEFAULT 'patient',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table users created');
    
    // Cabinets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cabinets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(2) DEFAULT 'FR',
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        timezone VARCHAR(50) DEFAULT 'Europe/Paris',
        business_hours JSONB,
        settings JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table cabinets created');
    
    // Practitioners table
    await client.query(`
      CREATE TABLE IF NOT EXISTS practitioners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
        specialty VARCHAR(100),
        license_number VARCHAR(100),
        title VARCHAR(50),
        bio TEXT,
        consultation_duration INTEGER DEFAULT 30,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table practitioners created');
    
    // Patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date_of_birth DATE,
        gender VARCHAR(10),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        medical_notes TEXT,
        allergies TEXT,
        insurance_info JSONB,
        preferred_language VARCHAR(5) DEFAULT 'fr',
        communication_preferences JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table patients created');
    
    // Services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER,
        price DECIMAL(10,2),
        color VARCHAR(7),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table services created');
    
    // Appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id),
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        duration INTEGER NOT NULL DEFAULT 30,
        status appointment_status DEFAULT 'scheduled',
        title VARCHAR(255),
        notes TEXT,
        patient_notes TEXT,
        patient_email VARCHAR(255),
        patient_phone VARCHAR(20),
        patient_name VARCHAR(255),
        price DECIMAL(10,2),
        paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        cancelled_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('  ✅ Table appointments created');
    
    // Email queue table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
        job_type email_job_type NOT NULL,
        status email_job_status DEFAULT 'pending',
        priority INTEGER DEFAULT 5,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        html_body TEXT,
        text_body TEXT,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        template_data JSONB,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_attempt_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table email_queue created');
    
    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table sessions created');
    
    // Create indexes
    console.log('\n📑 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at)',
      'CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)',
      'CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        const indexName = indexSql.match(/CREATE INDEX IF NOT EXISTS (\w+)/)[1];
        console.log(`  ✅ Index ${indexName} created`);
      } catch (err) {
        console.log(`  ⚠️ Index error: ${err.message}`);
      }
    }
    
    // Create update trigger function
    console.log('\n⚙️ Creating trigger functions...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('  ✅ Function update_updated_at_column created');
    
    // Apply triggers
    const tablesWithUpdatedAt = ['users', 'cabinets', 'practitioners', 'patients', 'services', 'appointments', 'email_queue'];
    for (const table of tablesWithUpdatedAt) {
      try {
        await client.query(`
          CREATE TRIGGER update_${table}_updated_at 
          BEFORE UPDATE ON ${table} 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
        `);
        console.log(`  ✅ Trigger for ${table} created`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ✅ Trigger for ${table} already exists`);
        }
      }
    }
    
    // Check if we need to seed data
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (userCount.rows[0].count == 0) {
      console.log('\n🌱 Seeding initial data...');
      
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
          '{"monday": {"open": "08:00", "close": "18:00"}}'::jsonb
        )
      `);
      console.log('  ✅ Test cabinet created');
      
      // Insert test users
      await client.query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name, phone, email_verified)
        VALUES 
          ('admin@cabinet-dentaire-cv.fr', $1, 'cabinet_admin', 'Marie', 'Dubois', '+33 6 12 34 56 78', true),
          ('dr.martin@cabinet-dentaire-cv.fr', $1, 'practitioner', 'Pierre', 'Martin', '+33 6 23 45 67 89', true),
          ('patient.test@example.com', $1, 'patient', 'Jean', 'Dupont', '+33 6 45 67 89 01', true)
      `, [hashedPassword]);
      console.log('  ✅ Test users created');
      console.log('\n  📋 Test Credentials:');
      console.log('    Admin: admin@cabinet-dentaire-cv.fr / password123');
      console.log('    Doctor: dr.martin@cabinet-dentaire-cv.fr / password123');
      console.log('    Patient: patient.test@example.com / password123');
    }
    
    // Get final counts
    console.log('\n📊 Database Summary:');
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM cabinets) as cabinets,
        (SELECT COUNT(*) FROM services) as services,
        (SELECT COUNT(*) FROM appointments) as appointments
    `);
    console.log(`  Users: ${counts.rows[0].users}`);
    console.log(`  Cabinets: ${counts.rows[0].cabinets}`);
    console.log(`  Services: ${counts.rows[0].services}`);
    console.log(`  Appointments: ${counts.rows[0].appointments}`);
    
    console.log('\n✨ Migrations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
runMigrations().then(() => {
  console.log('\n🎯 Next steps:');
  console.log('  1. Start the app: npm run dev');
  console.log('  2. Start WebSocket: npm run websocket');
  console.log('  3. Visit: http://localhost:3000');
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});