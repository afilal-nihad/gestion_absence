// Configuration de la connexion MySQL (utilise mysql2/promise)
const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function initDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

async function getConnection() {
  const db = await initDb();
  return db.getConnection();
}

module.exports = {
  initDb,
  getConnection
};

