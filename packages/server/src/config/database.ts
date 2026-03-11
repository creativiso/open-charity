import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import env from '../../../../config/env-validator';

dotenv.config();

const config = {
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  host: env.DB_HOST,
  port: Number(env.DB_PORT) || 3306,
  dialect: 'mysql' as const,
  logging: false,
};

const sequelize = new Sequelize(config.database!, config.username!, config.password!, config);

export { config };
export default sequelize;
