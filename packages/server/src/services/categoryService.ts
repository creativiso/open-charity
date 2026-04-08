import { Campaign, Category, sequelize, User } from '../models';

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

export const toggleCategoryStatus = async (id: string, adminUserId: string) => {
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

    await category.update({
      isActive: !category.isActive,
    });

    return category;
  } catch (err) {
    console.error('Could not toggle category status:', err);
    throw err;
  }
};

export const deleteCategory = async (id: string, adminUserId: string) => {
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

    const campaignsUsing = await Campaign.count({
      where: {
        categoryId: category.id,
      },
    });

    if (campaignsUsing > 0) {
      throw new ConflictError(`Cannot delete this category: ${campaignsUsing} are using it`);
    }

    await category.destroy();
  } catch (err) {
    console.error('Could not delete category:', err);
    throw err;
  }
};

export const getActiveCategories = async () => {
  try {
    const activeCategories = await Category.scope(['active', 'ordered']).findAll();

    return activeCategories;
  } catch (err) {
    console.error('Could not get active categories:', err);
    throw err;
  }
};

export const getAllCategories = async () => {
  try {
    const activeCategories = await Category.scope('ordered').findAll({
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Campaigns WHERE Campaigns.categoryId = Category.id)'
            ),
            'campaignCount',
          ],
        ],
      },
    });

    return activeCategories;
  } catch (err) {
    console.error('Could not get categories:', err);
    throw err;
  }
};

export const getCategoryById = async (id: string) => {
  try {
    const category = await Category.findByPk(id, {
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Campaigns WHERE Campaigns.categoryId = Category.id)'
            ),
            'campaignCount',
          ],
        ],
      },
    });

    return category;
  } catch (err) {
    console.error('Could not get category:', err);
    throw err;
  }
};

export const reorderCategories = async (orderedIds: string[], adminUserId: string) => {
  try {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new ValidationError('orderedIds must be a non-empty array');
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

    const uniqueIds = [...new Set(orderedIds)];

    await sequelize.transaction(async (t) => {
      for (let i = 0; i < uniqueIds.length; i++) {
        await Category.update(
          { displayOrder: i },
          {
            where: { id: uniqueIds[i] },
            transaction: t,
          }
        );
      }
    });

    return await Category.findAll({
      where: { id: orderedIds },
      order: [['displayOrder', 'ASC']],
    });
  } catch (err) {
    console.error('Could not reorder categories:', err);
    throw err;
  }
};
