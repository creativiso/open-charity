import { Router } from 'express';

// Import Admin Controllers
import adminAuthController from '../controllers/api/adminAuthController';
import adminOrgController from '../controllers/api/adminOrganizationsController';
import adminOrgMembersController from '../controllers/api/adminOrgMembersController';

const apiAdminRouter: Router = Router();

apiAdminRouter.use('/auth', adminAuthController);

apiAdminRouter.use('/organizations', adminOrgController);

apiAdminRouter.use('/organization-members', adminOrgMembersController);

export default apiAdminRouter;
