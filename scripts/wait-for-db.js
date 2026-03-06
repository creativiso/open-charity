import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const TIMEOUT = 30000; // 30 seconds
const INTERVAL = 2000; // 2 seconds

async function waitForDb() {
  const startTime = Date.now();
  let attempts = 0;

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'charity_db',
  };

  console.log('DB CONFIG:', config);
  while (Date.now() - startTime < TIMEOUT) {
    attempts++;
    try {
      const connection = await mysql.createConnection(config);
      await connection.end();

      console.log('Database is ready! Connected successfully after ' + attempts + ' attempt(s).');
      return;
    } catch (err) {
      // check what error is and log it
      console.log(`Attempt ${attempts} failed: ${err.message}`);
      console.log(`Database is not ready yet, retrying in ${INTERVAL / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, INTERVAL));
    }
  }
  throw new Error(
    `Database did not become ready within the ${TIMEOUT / 1000} seconds timeout period`
  );
}

waitForDb().catch((err) => {
  console.error(err);
});
