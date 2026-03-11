import { cleanEnv, str, num, url } from 'envalid';

const env = cleanEnv(process.env, {
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: num({ default: 3306 }),
  DB_NAME: str({ default: 'opencharity' }),
  DB_USER: str({ default: 'opencharity_user' }),
  DB_PASSWORD: str(), //required
  DB_DIALECT: str({ default: 'mysql', choices: ['mysql'] }),
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: num({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }), //optional
  NODE_ENV: str({ default: 'development', choices: ['development', 'production'] }),
  PORT: num({ default: 3000 }),
  BASE_URL: url({ default: 'http://localhost:3000' }),
  SESSION_SECRET: str(), //required
  SESSION_MAX_AGE: num({ default: 86400000 }),
  JWT_SECRET: str(), //required
  JWT_EXPIRES_IN: str({ default: '24h' }),
  UPLOAD_PATH: str({ default: './public/uploads' }),
  MAX_UPLOAD_SIZE: num({ default: 5242880 }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),
});

export default env;
