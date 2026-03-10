import express from 'express';
import { healthCheck, readyCheck } from '../controllers/healthController';

const healthRouter = express.Router();

healthRouter.get('/health', healthCheck);
healthRouter.get('/ready', readyCheck);

export default healthRouter;
