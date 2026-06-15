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

    try {
      await connection.query('ALTER TABLE board_posts MODIFY COLUMN user_id BIGINT UNSIGNED NULL;');
      console.log('board_posts.user_id set to NULLable.');
    } catch (err) {
      console.error('board_posts.user_id alter failed:', err.message);
      throw err;
    }

    try {
      await connection.query('ALTER TABLE board_posts ADD COLUMN guest_nickname VARCHAR(50) NULL AFTER user_id;');
      console.log('Column board_posts.guest_nickname added successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column board_posts.guest_nickname already exists.');
      } else {
        throw err;
      }
    }

    try {
      await connection.query('ALTER TABLE board_likes MODIFY COLUMN user_id BIGINT UNSIGNED NULL;');
      console.log('board_likes.user_id set to NULLable.');
    } catch (err) {
      console.error('board_likes.user_id alter failed:', err.message);
      throw err;
    }

    try {
      await connection.query('ALTER TABLE board_likes ADD COLUMN guest_nickname VARCHAR(50) NULL AFTER user_id;');
      console.log('Column board_likes.guest_nickname added successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column board_likes.guest_nickname already exists.');
      } else {
        throw err;
      }
    }

    try {
      await connection.query('CREATE UNIQUE INDEX unique_guest_like ON board_likes (post_id, guest_nickname);');
      console.log('Unique index unique_guest_like created successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('Unique index unique_guest_like already exists.');
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
