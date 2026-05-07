const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'egitim_platformu'
  });

  console.log('Connected.');
  try {
    await connection.query('ALTER TABLE board_posts MODIFY user_id BIGINT UNSIGNED NULL');
    console.log('Modified user_id to NULL.');
  } catch(e) { console.error(e.message); }

  try {
    await connection.query('ALTER TABLE board_posts ADD COLUMN guest_nickname VARCHAR(100) NULL');
    console.log('Added guest_nickname column.');
  } catch(e) { console.error(e.message); }

  try {
    await connection.query('ALTER TABLE board_likes MODIFY user_id BIGINT UNSIGNED NULL');
    console.log('Modified board_likes user_id to NULL.');
  } catch(e) { console.error(e.message); }

  try {
    await connection.query('ALTER TABLE board_likes ADD COLUMN guest_nickname VARCHAR(100) NULL');
    console.log('Added guest_nickname to board_likes.');
  } catch(e) { console.error(e.message); }

  await connection.end();
}

alterDb();
