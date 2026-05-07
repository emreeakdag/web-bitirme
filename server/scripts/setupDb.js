const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  try {
    // 1. Veritabanı olmadan MySQL'e bağlan
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // SQL dosyasındaki tüm komutları çalıştırmak için gerekli
    });

    console.log('MySQL sunucusuna baglanildi.');

    // 2. schema.sql dosyasını oku
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // 3. SQL sorgularını çalıştır
    console.log('Veritabani semasi olusturuluyor...');
    await connection.query(schemaSql);
    console.log('Veritabani ve tablolar basariyla olusturuldu!');

    await connection.end();
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
       console.error('❌ Erisim reddedildi. MAMP kullaniyorsaniz parolaniz root olabilir. Lutfen server/.env dosyasina gidip DB_PASSWORD=root yapmayi deneyin.');
    } else {
       console.error('❌ Kurulum sirasinda bir hata olustu:', error);
    }
    process.exit(1);
  }
}

setup();
