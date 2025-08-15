const bcrypt = require('bcryptjs');
const { memoryDb } = require('./src/lib/database/memory-db');

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
}

testAuth().catch(console.error);