import dotenv from 'dotenv';

import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';

import healthRoutes from './routes/healthRoutes';

import router from './router';

import './models/index';
import sequelize from './config/database';

import env from '../../../config/env-validator';
dotenv.config();

const app: Application = express();

const limiter = rateLimit({
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again in 15 minutes',
});

app.use(helmet());
app.use(limiter);
app.use(
  cors({
    origin: env.BASE_URL,
    credentials: true,
  })
);
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, '../views'));

app.set('view engine', 'ejs');

app.use(expressLayouts);

app.set('layout', 'layouts/main');

app.use(router);
app.use('/api', healthRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';

  console.error(`ERROR ${status}: ${message}`);

  res.status(status).json({
    error: true,
    message: message,
  });
});

const PORT = env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync();
    console.log('Models synced and tables verified.');

    app.listen(PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw new Error('Failed to start server');
  }
}

startServer();
