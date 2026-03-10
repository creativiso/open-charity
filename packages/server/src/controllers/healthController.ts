import { Request, Response } from 'express';
import sequelize from '../config/database';
import { createClient, RedisClientType } from 'redis';

const redisUrl = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
const redisClient: RedisClientType = createClient({
  url: redisUrl,
});

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const checks = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: 'unknown',
    redis: 'unknown',
    error: 'none',
  };

  try {
    await sequelize.authenticate();
    checks.database = 'HEALTHY';
  } catch (error: any) {
    checks.database = 'UNHEALTHY';
    checks.error = error.message || 'Database connection failed';
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      checks.redis = 'HEALTHY';
    } else {
      checks.redis = 'UNHEALTHY';
    }
  } catch (error: any) {
    checks.redis = 'UNHEALTHY';
    checks.error = error.message || 'Redis connection failed';
  }

  const isHealthy = checks.database === 'HEALTHY' && checks.redis === 'HEALTHY';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
};

export const readyCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    await sequelize.authenticate();

    const tables: any = await sequelize.getQueryInterface().showAllTables();
    const tableNames: string[] = tables.map((table: any) => {
      return typeof table === 'string' ? table.toLowerCase() : table.tableName.toLowerCase();
    });

    const hasMigrationsTable = tableNames.includes('sequelizemeta');
    const hasUsersTable = tableNames.includes('users');

    if (hasMigrationsTable && hasUsersTable) {
      // at least ine migration record
      const [results]: any = await sequelize.query('SELECT * FROM `SequelizeMeta` LIMIT 1');

      if (results.length > 0) {
        res.status(200).json({
          status: 'ready',
          database: 'connected',
        });
        return;
      }
    }

    res.status(503).json({
      status: 'not ready',
      database: 'migrations or database schema missing',
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'not ready',
      error: error.message || 'Database connection failed',
    });
  }
};
