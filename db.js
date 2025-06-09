const mysql = require('mysql2/promise');

// Configure your MySQL connection here
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '@Ganesh0325',
  database: 'school_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
