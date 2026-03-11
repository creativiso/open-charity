import dotenv from 'dotenv';
import { execSync } from 'child_process';
import chalk from 'chalk';
import mysql from 'mysql2/promise';
import { createClient } from 'redis';
import env from '../config/env-validator';

dotenv.config();

async function checkMySql() {
  try {
    const config = {
      host: env.DB_HOST || 'localhost',
      port: env.DB_PORT || 3306,
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || 'password',
      database: env.DB_NAME || 'charity_db',
    };

    const connection = await mysql.createConnection(config);
    await connection.end();

    console.log(chalk.green('Database is ready! Connected!'));
  } catch (error) {
    console.log(chalk.red('Error checking MySQL:'), error.message);
    return false;
  }
}

async function checkRedis() {
  try {
    const redisUrl = `redis://${env.REDIS_HOST || 'localhost'}:${env.REDIS_PORT || 6379}`;
    //console.log('Checking Redis at:', redisUrl);
    const redisClient = createClient({ url: redisUrl });

    await redisClient.connect();
    await redisClient.ping();
    await redisClient.quit();

    console.log(chalk.green('Redis is ready! Connected!'));
    return true;
  } catch (err) {
    console.log(chalk.red('Error checking Redis:'), err.message);
    return false;
  }
}

function checkDocker() {
  try {
    const output = execSync("docker ps --format '{{.Names}}'");
    console.log(chalk.blue('Docker running containers:\n' + output));
    return true;
  } catch (error) {
    console.error(chalk.red('Error checking Docker:'), error.message);
    return false;
  }
}

checkDocker();
checkMySql();
checkRedis();
