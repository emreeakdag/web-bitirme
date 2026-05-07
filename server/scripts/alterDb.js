const mysql = require('mysql2/promise');
require('dotenv').config();

async function alter() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'egitim_platformu'
    });

    console.log('Altering table...');
    await connection.query('ALTER TABLE questions ADD COLUMN image_url VARCHAR(500) AFTER question_text;');
    console.log('Column image_url added successfully.');
    await connection.end();
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error(err);
    }
  }
}

alter();
