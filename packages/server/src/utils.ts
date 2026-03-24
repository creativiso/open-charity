import { v4 as uuidv4 } from 'uuid';

export const generateUUID = (): string => {
  return uuidv4();
};

export const generateSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const formatDateSimple = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getPagination = (page: number = 1, limit: number = 10) => {
  const parsedLimit = limit > 0 ? limit : 10;
  const offset = (page - 1) * parsedLimit;

  return { limit: parsedLimit, offset };
};
