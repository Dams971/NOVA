import bcrypt from 'bcryptjs';
import { memoryDb } from './src/lib/database/memory-db';

async function testAuth() {
  console.log('Testing authentication...\n');
  
  // Test user lookup
  const user = await memoryDb.findUserByEmail('admin@cabinet-dentaire-cv.fr');
  console.log('Found user:', user ? {
    id: user.id,
    email: user.email,
    role: user.role,
    hasPasswordHash: !!user.password_hash
  } : 'Not found');
  
  if (user && user.password_hash) {
    // Test password verification
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`Password '${testPassword}' is valid:`, isValid);
    
    // Generate a new hash for reference
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('\nNew hash for password123:', newHash);
    console.log('Existing hash:', user.password_hash);
  }
  
  // List all users
  console.log('\nAll users in database:');
  const stats = await memoryDb.getStats();
  console.log('Total users:', stats.users);
}

testAuth().catch(console.error);