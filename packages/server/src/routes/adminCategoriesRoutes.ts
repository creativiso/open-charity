import express from 'express';

import { createAdminCategory, getCategories } from '../controllers/api/adminCategoriesController';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';
import { createCategoryValidation } from '../validators/categoryValidators';
import { handleValidationErrors } from '../middleware/handleValidationErrors';

const adminCategoriesRouter = express.Router();

adminCategoriesRouter.get('/', verifyToken, requireAdminJWT, getCategories);

adminCategoriesRouter.post(
  '/',
  verifyToken,
  requireAdminJWT,
  createCategoryValidation,
  handleValidationErrors,
  createAdminCategory
);

export default adminCategoriesRouter;
