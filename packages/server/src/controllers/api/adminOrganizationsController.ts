import { Request, Response, Router } from 'express';

import { requireAdminJWT, verifyToken } from '../../middleware/jwtAuth';
import {
  approveOrganization,
  rejectOrganization,
  searchOrganizations,
  updateOrganization,
} from '../../services/organizationService';
import { UpdateOrganizationData } from '../../interfaces/organizationService.interface';
import { handleError } from '../../utils';

const adminOrgController = Router();

adminOrgController.get(
  '/pending',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const pendingOrganizations = await searchOrganizations(
        { status: 'Pending' },
        { page, limit }
      );

      res.status(200).json(pendingOrganizations);
    } catch (err) {
      console.error('Getting pending organizations failed:' + err);
      handleError(err, res);
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
    } catch (err) {
      console.error('Could not approve organization:' + err);
      handleError(err, res);
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

      const rejectionReason = req.body?.rejectionReason;

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
    } catch (err) {
      console.error('Could not reject organization:' + err);
      handleError(err, res);
    }
  }
);

adminOrgController.put(
  '/:id',
  verifyToken,
  requireAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.params.id as string;

      const updatedData: UpdateOrganizationData = req.body;

      const updatedOrganization = await updateOrganization(organizationId, updatedData);

      res.status(200).json(updatedOrganization);
    } catch (err) {
      console.error('Could not update organization:' + err);
      handleError(err, res);
    }
  }
);

export default adminOrgController;
