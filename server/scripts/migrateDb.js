const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'egitim_platformu'
    });

    console.log('MySQL baglantisi basarili. Geçisler uygulanıyor...');

    // 1. Add missing columns to boards table
    const boardsMigrations = [
      `ALTER TABLE boards ADD COLUMN IF NOT EXISTS bg_image VARCHAR(500) DEFAULT 'default'`,
      `ALTER TABLE boards ADD COLUMN IF NOT EXISTS allow_posts BOOLEAN DEFAULT TRUE`
    ];

    for (const query of boardsMigrations) {
      try {
        await connection.query(query);
        console.log('✅ ' + query);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('⚠️ Sütun zaten var: ' + query);
        } else {
          throw err;
        }
      }
    }

    // 2. Add missing columns to board_posts table
    const postsMigrations = [
      `ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS guest_nickname VARCHAR(100) NULL`
    ];

    for (const query of postsMigrations) {
      try {
        await connection.query(query);
        console.log('✅ ' + query);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('⚠️ Sütun zaten var: ' + query);
        } else {
          throw err;
        }
      }
    }

    // 3. Add missing columns to board_likes table
    const likesMigrations = [
      `ALTER TABLE board_likes ADD COLUMN IF NOT EXISTS guest_nickname VARCHAR(100) NULL`
    ];

    for (const query of likesMigrations) {
      try {
        await connection.query(query);
        console.log('✅ ' + query);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('⚠️ Sütun zaten var: ' + query);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Tüm geçişler tamamlandı!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Geçiş hatası:', error.message);
    process.exit(1);
  }
}

migrate();
