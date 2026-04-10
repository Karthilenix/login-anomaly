const mysql = require('mysql2/promise');
require('dotenv').config();

const config = process.env.DATABASE_URL 
    ? { uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: 10 }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'anomaly_detection',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    };

const pool = process.env.DATABASE_URL ? mysql.createPool(process.env.DATABASE_URL) : mysql.createPool(config);

module.exports = pool;
