import { Category, sequelize, User } from '../models';

import { CreateCategoryData, UpdateCategoryData } from '../interfaces/categoryService.interface';

import { generateSlug } from '../utils';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors';

export const createCategory = async (data: CreateCategoryData, adminUserId: string) => {
  try {
    const adminMembership = await User.findOne({
      where: {
        id: adminUserId,
        role: 'admin',
      },
    });

    if (!adminMembership) {
      throw new ForbiddenError('You do not have admin permissions');
    }

    const slugRegex = /^[a-z0-9-]+$/;

    const slug = data.slug || generateSlug(data.name);

    const existing = await Category.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), data.name.toLowerCase()),
    });

    if (existing) {
      throw new ConflictError('A category with this name already exists');
    }

    if (!slugRegex.test(slug)) {
      throw new ValidationError('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    const createdCategory = await Category.create({
      ...data,
      slug,
      isActive: true,
    });

    return createdCategory;
  } catch (err) {
    console.error('Could not create category:', err);
    throw err;
  }
};

export const updateCategory = async (id: string, data: UpdateCategoryData, adminUserId: string) => {
  try {
    const category = await Category.findByPk(id);

    if (!category) {
      throw new NotFoundError('Could not find a category with this ID');
    }

    const adminMembership = await User.findOne({
      where: {
        id: adminUserId,
        role: 'admin',
      },
    });

    if (!adminMembership) {
      throw new ForbiddenError('You do not have admin permissions');
    }

    if (data.name && data.name !== category.name) {
      const existing = await Category.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          data.name.toLowerCase()
        ),
      });

      if (existing) {
        throw new ConflictError('A category with this name already exists');
      }

      data.slug = generateSlug(data.name);
    }

    await category.update(data);

    return category;
  } catch (err) {
    console.error('Could not update category:', err);
    throw err;
  }
};
