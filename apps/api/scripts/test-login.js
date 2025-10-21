const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testLogin() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('\n=== Testing Login ===');

    const email = 'test@example.com';
    const password = 'test123456';

    console.log(`\nAttempting to login with: ${email}`);

    const userResult = await pool.query(
      'SELECT id, email, nickname, password_hash, credits, role, status FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      await pool.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('\n✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Nickname: ${user.nickname}`);
    console.log(`  Credits: ${user.credits}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Status: ${user.status}`);
    console.log(`  Password hash: ${user.password_hash.substring(0, 20)}...`);

    if (user.status === 'banned') {
      console.log('\n❌ Account is banned');
      await pool.end();
      process.exit(1);
    }

    console.log('\n=== Testing Password ===');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Password is INVALID');

      // Test if the hash in database is correct
      console.log('\n=== Debugging Password Hash ===');
      console.log('Trying to create new hash for comparison...');
      const newHash = await bcrypt.hash(password, 10);
      console.log(`New hash: ${newHash.substring(0, 20)}...`);

      const testCompare = await bcrypt.compare(password, newHash);
      console.log(`Test compare with new hash: ${testCompare ? 'VALID' : 'INVALID'}`);

    } else {
      console.log('✅ Password is VALID');
      console.log('\n🎉 Login would succeed!');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testLogin();
