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

  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Category description must be at most 500 characters'),

  body('displayOrder')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
];

export const updateCategoryValidation = [
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Category name must be between 3 and 100 characters'),

  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Category description must be at most 500 characters'),

  body('displayOrder')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
];
