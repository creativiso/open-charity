import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';
import env from '../../../../config/env-validator';

export interface TokenPayload {
  id: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    id: user.id,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: (env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '1d',
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: true, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Token required for access!' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET!);

    const user = await User.findByPk((decoded as TokenPayload).id);

    if (!user) {
      res.status(401).json({ error: true, message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token!' });
  }
};

export const requireAdminJWT = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: true, message: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: true, message: 'Access denied: Admins only' });
    return;
  }

  next();
};
