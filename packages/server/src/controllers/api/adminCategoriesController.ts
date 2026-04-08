import { Request, Response } from 'express';

import * as categoryService from '../../services/categoryService';

import { handleError } from '../../utils';
import { CreateCategoryData, UpdateCategoryData } from '../../interfaces/categoryService.interface';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();

    res.status(200).json(categories);
  } catch (err) {
    console.error('Could not get categories:' + err);
    handleError(err, res);
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const categoryData: CreateCategoryData = req.body;
    const adminUserId = req.user!.id;

    const createdCategory = await categoryService.createCategory(categoryData, adminUserId);

    res.status(201).json(createdCategory);
  } catch (err) {
    console.error('Could not create category:' + err);
    handleError(err, res);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id as string;
    const updatedCategoryData: UpdateCategoryData = req.body;
    const adminUserId = req.user!.id;

    const updatedCategory = await categoryService.updateCategory(
      categoryId,
      updatedCategoryData,
      adminUserId
    );

    res.status(200).json(updatedCategory);
  } catch (err) {
    console.error('Could not update category:' + err);
    handleError(err, res);
  }
};

export const toggleCategoryStatus = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id as string;
    const adminUserId = req.user!.id;

    const updatedCategory = await categoryService.toggleCategoryStatus(categoryId, adminUserId);

    res.status(200).json(updatedCategory);
  } catch (err) {
    console.error('Could not toggle category status:' + err);
    handleError(err, res);
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id as string;
    const adminUserId = req.user!.id;

    await categoryService.deleteCategory(categoryId, adminUserId);

    res.status(204).send();
  } catch (err) {
    console.error('Could not delete category:' + err);
    handleError(err, res);
  }
};

export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body;
    const adminUserId = req.user!.id;

    const orderedCategories = await categoryService.reorderCategories(orderedIds, adminUserId);

    res.status(200).json(orderedCategories);
  } catch (err) {
    console.error('Could not reorder categories:' + err);
    handleError(err, res);
  }
};
