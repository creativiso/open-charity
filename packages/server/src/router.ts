import { Router } from 'express';

import adminAuthController from './controllers/api/adminAuthController';
import authController from './controllers/authController';
import campaignsController from './controllers/campaignsController';
import organizationsController from './controllers/organizationsController';

const router: Router = Router();

router.use('/api/admin/auth', adminAuthController);
router.use('/auth', authController);
router.use('/campaigns', campaignsController);
router.use('/organizations', organizationsController);

router.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

router.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error' });
});

export default router;
