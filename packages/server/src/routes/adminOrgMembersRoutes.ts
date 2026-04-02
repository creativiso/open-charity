import { Router } from 'express';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';

import {
  getPendingMemberships,
  approveMember,
  rejectMember,
  updateMemberRoleHandler,
} from '../controllers/api/adminOrgMembersController';

const adminOrgMembersRoutes: Router = Router();

adminOrgMembersRoutes.get('/pending', verifyToken, requireAdminJWT, getPendingMemberships);
adminOrgMembersRoutes.patch('/:id/approve', verifyToken, requireAdminJWT, approveMember);
adminOrgMembersRoutes.patch('/:id/reject', verifyToken, requireAdminJWT, rejectMember);
adminOrgMembersRoutes.patch('/:id/role', verifyToken, requireAdminJWT, updateMemberRoleHandler);

export default adminOrgMembersRoutes;
