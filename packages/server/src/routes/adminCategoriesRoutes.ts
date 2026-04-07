import express from 'express';

import {
  createCategory,
  deleteCategory,
  getCategories,
  reorderCategories,
  toggleCategoryStatus,
  updateCategory,
} from '../controllers/api/adminCategoriesController';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';
import {
  createCategoryValidation,
  updateCategoryValidation,
} from '../validators/categoryValidators';
import { handleValidationErrors } from '../middleware/handleValidationErrors';

const adminCategoriesRouter = express.Router();

adminCategoriesRouter.get('/', verifyToken, requireAdminJWT, getCategories);

adminCategoriesRouter.post(
  '/',
  verifyToken,
  requireAdminJWT,
  createCategoryValidation,
  handleValidationErrors,
  createCategory
);

adminCategoriesRouter.put(
  '/:id',
  verifyToken,
  requireAdminJWT,
  updateCategoryValidation,
  handleValidationErrors,
  updateCategory
);

adminCategoriesRouter.patch('/:id/toggle', verifyToken, requireAdminJWT, toggleCategoryStatus);
adminCategoriesRouter.patch('/reorder', verifyToken, requireAdminJWT, reorderCategories);

adminCategoriesRouter.delete('/:id', verifyToken, requireAdminJWT, deleteCategory);

export default adminCategoriesRouter;
