import express from 'express';

import {
  createUserOrganization,
  getOrganizationById,
  getOrganizationCampaigns,
  getOrganizations,
  joinOrganization,
  getMyOrganizations,
} from '../controllers/organizationsController';

import { requireAuth } from '../middleware/auth';
import { createOrganizationValidation } from '../validators/organizationValidators';

const organizationsRouter = express.Router();

organizationsRouter.get('/', getOrganizations);
organizationsRouter.get('/:id', getOrganizationById);
organizationsRouter.get('/:id/campaigns', getOrganizationCampaigns);

organizationsRouter.post('/', createOrganizationValidation, requireAuth, createUserOrganization);
organizationsRouter.post('/:id/join', requireAuth, joinOrganization);
organizationsRouter.get('/users/me/organizations', requireAuth, getMyOrganizations);

export default organizationsRouter;
