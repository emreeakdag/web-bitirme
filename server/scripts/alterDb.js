const mysql = require('mysql2/promise');
require('dotenv').config();

async function alter() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'egitim_platformu'
    });

    console.log('Altering table...');
    try {
      await connection.query("ALTER TABLE boards ADD COLUMN bg_image VARCHAR(50) NOT NULL DEFAULT 'default' AFTER teacher_id;");
      console.log('Column bg_image added successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column bg_image already exists.');
      } else {
        throw err;
      }
    }

    try {
      await connection.query('ALTER TABLE boards ADD COLUMN allow_posts BOOLEAN DEFAULT TRUE AFTER is_active;');
      console.log('Column allow_posts added successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column allow_posts already exists.');
      } else {
        throw err;
      }
    }

    try {
      await connection.query('ALTER TABLE questions ADD COLUMN image_url VARCHAR(500) AFTER question_text;');
      console.log('Column image_url added successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column image_url already exists.');
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

alter();
