import { Request, Response } from 'express';
import { handleError } from '../utils';
import { getActiveCategories } from '../services/categoryService';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getActiveCategories();

    res.status(200).json(categories);
  } catch (err) {
    console.error('Could not get categories:' + err);
    handleError(err, res);
  }
};
