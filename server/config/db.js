const mysql = require('mysql2/promise');
require('dotenv').config();

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
  throw new Error('Missing required DB environment variables: DB_HOST, DB_USER, DB_NAME');
}

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL baglantisi basarili.');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL baglanti hatasi:', err.message);
  });

module.exports = pool;
