const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'egitim_platformu',
    });

    console.log('Checking quiz_participants.user_id...');
    try {
      await connection.query('ALTER TABLE quiz_participants ADD COLUMN user_id INT NULL AFTER id');
      console.log('Added user_id column to quiz_participants.');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('user_id column already exists.');
      } else {
        throw error;
      }
    }

    try {
      await connection.query('CREATE INDEX idx_quiz_participants_user_id ON quiz_participants (user_id)');
      console.log('Created index idx_quiz_participants_user_id.');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_quiz_participants_user_id already exists.');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
