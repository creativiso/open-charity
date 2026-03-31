import { Request, Response, Router } from 'express';

import { requireAdminJWT, verifyToken } from '../../middleware/jwtAuth';
import { searchOrganizations } from '../../services/organizationService';

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

export default adminOrgController;
