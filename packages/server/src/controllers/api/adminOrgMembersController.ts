import { Request, Response, Router } from 'express';

import { requireAdminJWT, verifyToken } from '../../middleware/jwtAuth';

import { getMemberships } from '../../services/organizationService';
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

export default adminOrgMembersController;
