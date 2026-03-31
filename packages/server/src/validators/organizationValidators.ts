import { body } from 'express-validator';
import Organization from '../models/Organization';

export const createOrganizationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Organization name must be between 2 and 255 characters')
    .custom(async (name: string) => {
      const existingOrg = await Organization.findOne({ where: { name } });
      if (existingOrg) {
        throw new Error('Organization name already in use');
      }
    }),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Organization description is required')
    .isLength({ max: 500 })
    .withMessage('Organization description must be at most 500 characters'),

  body('websiteUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Must be a valid website URL'),

  body('contactEmail')
    .trim()
    .notEmpty()
    .withMessage('Contact email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('locationRegion').trim().notEmpty().withMessage('Location region is required'),

  body('locationCity').trim().notEmpty().withMessage('Location city is required'),
];
