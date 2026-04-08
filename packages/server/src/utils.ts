import { Response } from 'express';

import { v4 as uuidv4 } from 'uuid';

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from './errors';

export const generateUUID = (): string => {
  return uuidv4();
};

export const generateSlug = (text: string): string => {
  const slug = text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  return slug || 'unnamed';
};

export const formatDateSimple = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getPagination = (page: number = 1, limit: number = 10) => {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.min(50, Math.max(1, limit || 10));
  const offset = (safePage - 1) * safeLimit;

  return { limit: safeLimit, offset, safePage };
};

export const handleError = (err: unknown, res: Response) => {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: true, message: err.message });
  } else if (err instanceof ForbiddenError) {
    res.status(403).json({ error: true, message: err.message });
  } else if (err instanceof ConflictError) {
    res.status(409).json({ error: true, message: err.message });
  } else if (err instanceof ValidationError) {
    res.status(400).json({ error: true, message: err.message });
  } else {
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};
