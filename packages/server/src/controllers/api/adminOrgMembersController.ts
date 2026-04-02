import { Request, Response, Router } from 'express';

import { requireAdminJWT, verifyToken } from '../../middleware/jwtAuth';

import {
  approveMembership,
  getMemberships,
  rejectMembership,
  updateMemberRole,
} from '../../services/organizationService';
import { handleError } from '../../utils';

const adminOrgMembersController = Router();

adminOrgMembersController.get(
  '/pending',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await getMemberships({ status: 'Pending' }, { page, limit });

      res.status(200).json(result);
    } catch (err) {
      console.error('Getting pending memberships failed:' + err);
      handleError(err, res);
    }
  }
);

adminOrgMembersController.patch(
  '/:id/approve',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const membershipId = req.params.id as string;
      const adminId = req.user!.id;

      const approvedMembership = await approveMembership(membershipId, adminId);

      res.status(200).json(approvedMembership);
    } catch (err) {
      console.error('Could not approve membership:' + err);
      handleError(err, res);
    }
  }
);

adminOrgMembersController.patch(
  '/:id/reject',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const membershipId = req.params.id as string;
      const adminId = req.user!.id;

      const rejectionReason = req.body?.rejectionReason;

      if (!rejectionReason) {
        res.status(400).json({ error: true, message: 'Rejection reason is required' });
        return;
      }

      const rejectedMembership = await rejectMembership(membershipId, adminId, rejectionReason);

      res.status(200).json(rejectedMembership);
    } catch (err) {
      console.error('Could not reject membership:' + err);
      handleError(err, res);
    }
  }
);

adminOrgMembersController.patch(
  '/:id/role',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const membershipId = req.params.id as string;
      const adminId = req.user!.id;

      const role = req.body?.role;

      if (!role || !['admin', 'editor'].includes(role)) {
        res.status(400).json({
          error: true,
          message: "Invalid or missing role. Role must be either 'admin' or 'editor'",
        });
        return;
      }

      const updatedMembership = await updateMemberRole(membershipId, role, adminId);

      res.status(200).json(updatedMembership);
    } catch (err) {
      console.error('Could not update member role:' + err);
      handleError(err, res);
    }
  }
);

export default adminOrgMembersController;
