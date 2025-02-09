
require('dotenv').config(); 
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = process.env.DB_PATH;
const DB_TABLE_Auth =process.env.DB_TABLE_Auth
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS ${DB_TABLE_Auth} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);
});

module.exports = db;
