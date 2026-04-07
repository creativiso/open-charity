import { Request, Response } from 'express';

import { createCategory, getAllCategories } from '../../services/categoryService';

import { handleError } from '../../utils';
import { CreateCategoryData } from '../../interfaces/categoryService.interface';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();

    res.status(200).json(categories);
  } catch (err) {
    console.error('Could not get categories:' + err);
    handleError(err, res);
  }
};

export const createAdminCategory = async (req: Request, res: Response) => {
  try {
    const categoryData: CreateCategoryData = req.body;
    const adminUserId = req.user!.id;

    const createdCategory = await createCategory(categoryData, adminUserId);

    res.status(201).json(createdCategory);
  } catch (err) {
    console.error('Could not create category:' + err);
    handleError(err, res);
  }
};
