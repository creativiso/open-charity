import { body } from 'express-validator';
import { Category } from '../models';

export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Category name must be between 3 and 100 characters')
    .custom(async (name: string) => {
      const existing = await Category.findOne({ where: { name } });
      if (existing) {
        throw new Error('Category name already in use');
      }
    }),

  body('description').optional({ checkFalsy: true }).trim(),

  body('displayOrder')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
];
