import express from 'express';

import { getCategories } from '../controllers/api/adminCategoriesController';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';

const adminCategoriesRouter = express.Router();

adminCategoriesRouter.get('/', verifyToken, requireAdminJWT, getCategories);

export default adminCategoriesRouter;
