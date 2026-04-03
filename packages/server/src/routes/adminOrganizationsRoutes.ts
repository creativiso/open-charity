import { Router } from 'express';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';

import {
  getPendingOrganizations,
  approveOrg,
  rejectOrg,
  updateOrg,
} from '../controllers/api/adminOrganizationsController';

const adminOrganizationsRouter: Router = Router();

adminOrganizationsRouter.get('/pending', verifyToken, requireAdminJWT, getPendingOrganizations);
adminOrganizationsRouter.patch('/:id/approve', verifyToken, requireAdminJWT, approveOrg);
adminOrganizationsRouter.patch('/:id/reject', verifyToken, requireAdminJWT, rejectOrg);
adminOrganizationsRouter.put('/:id', verifyToken, requireAdminJWT, updateOrg);

export default adminOrganizationsRouter;
