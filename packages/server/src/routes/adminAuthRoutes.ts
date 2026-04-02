import { Router } from 'express';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';

import { adminLogin, getMe, refreshToken } from '../controllers/api/adminAuthController';

import { loginValidation } from '../validators/userValidators';
import { handleValidationErrors } from '../middleware/handleValidationErrors';

const adminAuthRouter: Router = Router();

adminAuthRouter.post('/login', loginValidation, handleValidationErrors, adminLogin);
adminAuthRouter.post('/refresh', verifyToken, requireAdminJWT, refreshToken);
adminAuthRouter.get('/me', verifyToken, requireAdminJWT, getMe);

export default adminAuthRouter;
