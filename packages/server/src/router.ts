import { Router } from 'express';

import authController from './controllers/authController';
import campaignsController from './controllers/campaignsController';

import organizationsRouter from './routes/organizationsRoutes';
import adminAuthRouter from './routes/adminAuthRoutes';
import adminOrganizationsRouter from './routes/adminOrganizationsRoutes';
import adminOrgMembersRouter from './routes/adminOrgMembersRoutes';
import categoriesRouter from './routes/categoriesRoutes';
import adminCategoriesRouter from './routes/adminCategoriesRoutes';

const router: Router = Router();

router.use('/api/admin/auth', adminAuthRouter);
router.use('/api/admin/organizations', adminOrganizationsRouter);
router.use('/api/admin/organization-members', adminOrgMembersRouter);
router.use('/api/admin/categories', adminCategoriesRouter);
router.use('/auth', authController);
router.use('/campaigns', campaignsController);
router.use('/organizations', organizationsRouter);
router.use('/categories', categoriesRouter);

router.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

router.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error' });
});

export default router;
