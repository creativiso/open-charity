import express from 'express';
import {
  getOrganizationById,
  getOrganizationCampaigns,
  getOrganizations,
} from '../controllers/organizationsController';

const organizationsRouter = express.Router();

organizationsRouter.get('/', getOrganizations);
organizationsRouter.get('/:id', getOrganizationById);
organizationsRouter.get('/:id/campaigns', getOrganizationCampaigns);

export default organizationsRouter;
