const mysql = require("mysql2/promise");

// สร้าง connection pool
const pool = mysql.createPool({
  host: "0.tcp.ap.ngrok.io",   // Host จาก ngrok
  port: 14539,                 // Port จาก ngrok
  user: "root",                // user MySQL
  password: "1234",   // password MySQL
  database: "lineapp",         // DB ที่สร้างไว้
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;