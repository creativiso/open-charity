import { body } from 'express-validator';
import User from '../models/User';
import { validatePasswordStrength } from '../middleware/auth';

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .custom(async (email: string) => {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((password: string) => {
      if (!validatePasswordStrength(password)) {
        throw new Error(
          'Password must be at least 8 characters and include uppercase, lowercase, and a number'
        );
      }
      return true;
    }),
];
