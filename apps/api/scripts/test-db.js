const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);

    const result = await pool.query('SELECT email, nickname, credits FROM users');
    console.log('\nUsers in database:');
    console.table(result.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
