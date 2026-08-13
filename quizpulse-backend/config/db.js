// config/db.js
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    // 🚨 UPDATE THESE TWO LINES:
    encrypt: true, // Forces SSL encryption required by your SQL Server
    trustServerCertificate: true, // Prevents errors with local/self-signed SSL certificates
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ SQL Server Connection Failed:', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};