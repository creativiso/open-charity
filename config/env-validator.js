import Joi from 'joi';

const schema = Joi.object({
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().default(3306),
  DB_USER: Joi.string().default('opencharity_user'),
  DB_PASSWORD: Joi.string().default('password').required().messages({
    'any.required': 'Database password is required',
  }),
  DB_NAME: Joi.string().default('opencharity'),
  DB_DIALECT: Joi.string().valid('mysql').default('mysql'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().default(6379),
  REDIS_PASSWORD: Joi.string().optional(), //optional

  NODE_ENV: Joi.string().valid('development', 'production').default('development'),
  PORT: Joi.number().integer().default(3000),
  BASE_URL: Joi.string().uri().default('http://localhost:3000'),

  SESSION_SECRET: Joi.string().required().messages({
    'any.required': 'Session secret is required',
  }), //required
  SESSION_MAX_AGE: Joi.number().integer().default(86400000),

  JWT_SECRET: Joi.string().required().messages({
    'any.required': 'JWT secret is required',
  }), //required
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  UPLOAD_PATH: Joi.string().default('./public/uploads'),
  MAX_UPLOAD_SIZE: Joi.number().integer().default(5242880),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().default(100),
}).unknown();

const { error, value: envVars } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(
    'Environment variable validation error:',
    error.details.map((d) => d.message).join(', ')
  );
}

Object.assign(process.env, envVars);
