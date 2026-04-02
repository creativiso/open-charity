import express from 'express';

import {
  createUserOrganization,
  getOrganizationById,
  getOrganizationCampaigns,
  getOrganizations,
  joinOrganization,
  getMyOrganizations,
  getMembersInOrganization,
  updateRoleOfMember,
  deleteMember,
} from '../controllers/organizationsController';

import { requireAuth } from '../middleware/auth';
import { createOrganizationValidation } from '../validators/organizationValidators';
import { requireOrgAdmin } from '../middleware/orgContext';

const organizationsRouter = express.Router();

organizationsRouter.get('/', getOrganizations);
organizationsRouter.get('/:id', getOrganizationById);
organizationsRouter.get('/:id/campaigns', getOrganizationCampaigns);

organizationsRouter.post('/', createOrganizationValidation, requireAuth, createUserOrganization);
organizationsRouter.post('/:id/join', requireAuth, joinOrganization);
organizationsRouter.get('/users/me/organizations', requireAuth, getMyOrganizations);

organizationsRouter.get('/:id/members', requireAuth, requireOrgAdmin, getMembersInOrganization);
organizationsRouter.patch(
  '/:id/members/:memberId/role',
  requireAuth,
  requireOrgAdmin,
  updateRoleOfMember
);
organizationsRouter.delete('/:id/members/:memberId', requireAuth, requireOrgAdmin, deleteMember);

export default organizationsRouter;
