import bcryptjs from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import User from '../models/User';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcryptjs.compare(password, hash);
};

export const validatePasswordStrength = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(301).redirect('/login');
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(301).redirect('/login');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).send('Not authenticated');
  }

  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(401).send('Admin access required');
  }
};
