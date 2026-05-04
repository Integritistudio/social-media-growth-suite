/**
 * Run once: node setup-db.js
 * Creates the MySQL database if it doesn't exist, then syncs all models.
 */
require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function createDatabase() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Test@123',
  });
  const dbName = process.env.DB_NAME || 'social_media_ai';
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`Database '${dbName}' ready.`);
  await conn.end();
}

createDatabase()
  .then(() => require('./models').syncDatabase())
  .then(() => { console.log('All tables created. Setup complete!'); process.exit(0); })
  .catch(err => { console.error('Setup failed:', err.message); process.exit(1); });
