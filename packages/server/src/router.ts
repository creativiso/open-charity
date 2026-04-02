import { Router } from 'express';

import authController from './controllers/authController';
import campaignsController from './controllers/campaignsController';
import organizationsRouter from './routes/organizationsRoutes';
import apiAdminRouter from './routes/apiAdminRoutes';

const router: Router = Router();

router.use('/api/admin', apiAdminRouter);
router.use('/auth', authController);
router.use('/campaigns', campaignsController);
router.use('/organizations', organizationsRouter);

router.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

router.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error' });
});

export default router;
