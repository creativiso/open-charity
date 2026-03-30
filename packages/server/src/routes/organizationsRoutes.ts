import express from 'express';
import { getOrganizationById } from '../controllers/organizationsController';

const organizationsRouter = express.Router();

organizationsRouter.get('/:id', getOrganizationById);

export default organizationsRouter;
