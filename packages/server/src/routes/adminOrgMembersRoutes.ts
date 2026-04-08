import { Router } from 'express';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';

import {
  getPendingMemberships,
  approveMember,
  rejectMember,
  updateMemberRoleHandler,
} from '../controllers/api/adminOrgMembersController';

const adminOrgMembersRouter: Router = Router();

adminOrgMembersRouter.get('/pending', verifyToken, requireAdminJWT, getPendingMemberships);
adminOrgMembersRouter.patch('/:id/approve', verifyToken, requireAdminJWT, approveMember);
adminOrgMembersRouter.patch('/:id/reject', verifyToken, requireAdminJWT, rejectMember);
adminOrgMembersRouter.patch('/:id/role', verifyToken, requireAdminJWT, updateMemberRoleHandler);

export default adminOrgMembersRouter;
