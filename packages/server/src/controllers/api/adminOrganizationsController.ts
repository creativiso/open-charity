import { Request, Response, Router } from 'express';

import { requireAdminJWT, verifyToken } from '../../middleware/jwtAuth';
import {
  approveMembership,
  approveOrganization,
  rejectOrganization,
  searchOrganizations,
} from '../../services/organizationService';

const adminOrgController = Router();

adminOrgController.get(
  '/pending',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const pendingOrganizations = await searchOrganizations(
        { status: 'Pending' },
        { page, limit }
      );

      res.status(200).json(pendingOrganizations);
    } catch (err: any) {
      console.error('Getting pending organizations failed:' + err);
      res.status(err.status || 500).json({ error: true, message: err.message });
    }
  }
);

adminOrgController.patch(
  '/:id/approve',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.params.id as string;
      const adminId = req.user!.id;

      const approvedOrganization = await approveOrganization(organizationId, adminId);

      res.status(200).json(approvedOrganization);
    } catch (err: any) {
      console.error('Could not approve organization:' + err);
      res.status(err.status || 500).json({ error: true, message: err.message });
    }
  }
);

adminOrgController.patch(
  '/:id/reject',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.params.id as string;
      const adminId = req.user!.id;

      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        res.status(400).json({ error: true, message: 'Rejection reason is required' });
        return;
      }

      const rejectedOrganization = await rejectOrganization(
        organizationId,
        adminId,
        rejectionReason
      );

      res.status(200).json(rejectedOrganization);
    } catch (err: any) {
      console.error('Could not reject organization:' + err);
      res.status(err.status || 500).json({ error: true, message: err.message });
    }
  }
);

export default adminOrgController;
