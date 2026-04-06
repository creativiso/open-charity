import { Category, Campaign, User, sequelize } from '../../src/models';

import {
  createCategory,
  deleteCategory,
  getActiveCategories,
  toggleCategoryStatus,
  updateCategory,
} from '../../src/services/categoryService';

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../src/errors';

jest.mock('../../src/models', () => ({
  Category: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    scope: jest.fn().mockReturnThis(),
  },
  Campaign: {
    count: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
  sequelize: {
    where: jest.fn(),
    fn: jest.fn(),
    col: jest.fn(),
    literal: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock('../../src/utils', () => ({
  generateSlug: jest.fn((text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
  ),
}));

const mockCategory: any = {
  id: 'category-uuid',
  name: 'Education',
  slug: 'education',
  description: 'Educational campaigns',
  isActive: true,
  displayOrder: 0,
  update: jest.fn().mockImplementation((data: any) => {
    Object.assign(mockCategory, data);
    return Promise.resolve(mockCategory);
  }),
  destroy: jest.fn().mockResolvedValue(true),
};

const mockAdmin = { id: 'admin-uuid', role: 'admin' };

beforeEach(() => {
  jest.clearAllMocks();
  mockCategory.name = 'Education';
  mockCategory.slug = 'education';
  mockCategory.isActive = true;
  mockCategory.displayOrder = 0;
});

// ─── createCategory ───────────────────────────────────────────────

describe('createCategory', () => {
  const createData = {
    name: 'Education',
    description: 'Educational campaigns',
  };

  beforeEach(() => {
    (User.findOne as jest.Mock).mockResolvedValue(mockAdmin);
  });

  it('should create a category with auto-generated slug', async () => {
    (Category.findOne as jest.Mock).mockResolvedValue(null);
    (Category.create as jest.Mock).mockResolvedValue(mockCategory);

    const result = await createCategory(createData, 'admin-uuid');

    expect(Category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Education',
        slug: 'education',
        isActive: true,
      })
    );
    expect(result).toEqual(mockCategory);
  });

  it('should use provided slug if given', async () => {
    (Category.findOne as jest.Mock).mockResolvedValue(null);
    (Category.create as jest.Mock).mockResolvedValue(mockCategory);

    await createCategory({ ...createData, slug: 'custom-slug' }, 'admin-uuid');

    expect(Category.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'custom-slug' }));
  });

  it('should throw ConflictError if name already exists', async () => {
    (Category.findOne as jest.Mock).mockResolvedValue(mockCategory);

    await expect(createCategory(createData, 'admin-uuid')).rejects.toThrow(ConflictError);

    expect(Category.create).not.toHaveBeenCalled();
  });

  it('should throw ValidationError if slug is not URL-safe', async () => {
    (Category.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      createCategory({ ...createData, slug: 'invalid slug!' }, 'admin-uuid')
    ).rejects.toThrow(ValidationError);

    expect(Category.create).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenError if user is not admin', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(createCategory(createData, 'non-admin-uuid')).rejects.toThrow(ForbiddenError);
  });
});

// ─── updateCategory ───────────────────────────────────────────────

describe('updateCategory', () => {
  beforeEach(() => {
    (User.findOne as jest.Mock).mockResolvedValue(mockAdmin);
  });

  it('should update category fields', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);

    const result = await updateCategory('category-uuid', { description: 'Updated' }, 'admin-uuid');

    expect(mockCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Updated' })
    );
    expect(result).toEqual(mockCategory);
  });

  it('should regenerate slug when name changes', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);
    (Category.findOne as jest.Mock).mockResolvedValue(null);

    await updateCategory('category-uuid', { name: 'New Name' }, 'admin-uuid');

    expect(mockCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Name', slug: 'new-name' })
    );
  });

  it('should throw ConflictError if new name already taken', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);
    (Category.findOne as jest.Mock).mockResolvedValue({ id: 'other-uuid', name: 'New Name' });

    await expect(
      updateCategory('category-uuid', { name: 'New Name' }, 'admin-uuid')
    ).rejects.toThrow(ConflictError);

    expect(mockCategory.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError if category not found', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(updateCategory('bad-uuid', { name: 'New Name' }, 'admin-uuid')).rejects.toThrow(
      NotFoundError
    );
  });

  it('should skip name uniqueness check if name is unchanged', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);

    await updateCategory('category-uuid', { name: 'Education' }, 'admin-uuid');

    expect(Category.findOne).not.toHaveBeenCalled();
    expect(mockCategory.update).toHaveBeenCalled();
  });
});

// ─── toggleCategoryStatus ─────────────────────────────────────────

describe('toggleCategoryStatus', () => {
  beforeEach(() => {
    (User.findOne as jest.Mock).mockResolvedValue(mockAdmin);
  });

  it('should toggle isActive from true to false', async () => {
    mockCategory.isActive = true;
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);

    const result = await toggleCategoryStatus('category-uuid', 'admin-uuid');

    expect(mockCategory.update).toHaveBeenCalledWith({
      isActive: false,
    });
    expect(result.isActive).toBe(false);
    expect(result).toEqual(mockCategory);
  });

  it('should toggle isActive from false to true', async () => {
    mockCategory.isActive = false;
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);

    const result = await toggleCategoryStatus('category-uuid', 'admin-uuid');

    expect(mockCategory.update).toHaveBeenCalledWith({
      isActive: true,
    });
    expect(result.isActive).toBe(true);
  });

  it('should throw NotFoundError if category does not exist', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(toggleCategoryStatus('non-existent-uuid', 'admin-uuid')).rejects.toThrow(
      NotFoundError
    );

    expect(mockCategory.update).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenError if user is not admin', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);

    await expect(toggleCategoryStatus('category-uuid', 'non-admin-uuid')).rejects.toThrow(
      ForbiddenError
    );

    expect(mockCategory.update).not.toHaveBeenCalled();
  });
});

// ─── deleteCategory ───────────────────────────────────────────────

describe('deleteCategory', () => {
  beforeEach(() => {
    (User.findOne as jest.Mock).mockResolvedValue(mockAdmin);
  });

  it('should delete a category if it has no campaigns', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);
    (Campaign.count as jest.Mock).mockResolvedValue(0); // No campaigns found

    const result = await deleteCategory('category-uuid', 'admin-uuid');

    expect(Campaign.count).toHaveBeenCalledWith({
      where: { categoryId: 'category-uuid' },
    });
    expect(mockCategory.destroy).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should throw ConflictError if category is in use by campaigns', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);
    (Campaign.count as jest.Mock).mockResolvedValue(5); // 5 campaigns found

    await expect(deleteCategory('category-uuid', 'admin-uuid')).rejects.toThrow(ConflictError);

    expect(mockCategory.destroy).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError if category does not exist', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(deleteCategory('bad-uuid', 'admin-uuid')).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError if user is not an admin', async () => {
    (Category.findByPk as jest.Mock).mockResolvedValue(mockCategory);
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(deleteCategory('category-uuid', 'non-admin-uuid')).rejects.toThrow(ForbiddenError);

    expect(mockCategory.destroy).not.toHaveBeenCalled();
  });
});

// ─── getActiveCategories ──────────────────────────────────────────

describe('getActiveCategories', () => {
  it('should return only active categories ordered by displayOrder', async () => {
    (Category.findAll as jest.Mock).mockResolvedValue([mockCategory]);

    const result = await getActiveCategories();

    expect(Category.scope).toHaveBeenCalledWith(['active', 'ordered']);

    expect(Category.findAll).toHaveBeenCalledWith();

    expect(result).toHaveLength(1);
  });

  it('should return empty array if no active categories', async () => {
    (Category.findAll as jest.Mock).mockResolvedValue([]);

    const result = await getActiveCategories();

    expect(result).toHaveLength(0);
  });
});
