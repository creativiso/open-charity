import { Request, Response, Router } from 'express';

import { requireAdminJWT, verifyToken } from '../../middleware/jwtAuth';

import {
  approveMembership,
  getMemberships,
  rejectMembership,
} from '../../services/organizationService';
import { handleError } from '../../utils';

const adminOrgMembersController = Router();

adminOrgMembersController.get(
  '/pending',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);

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

      const { rejectionReason } = req.body;

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

export default adminOrgMembersController;
