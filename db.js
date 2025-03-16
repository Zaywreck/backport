const mysql = require('mysql2/promise');
require('dotenv').config();
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS ? "Parola Var" : "Parola Yok!");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: 'ZaywrecK637858.',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

module.exports = pool;
