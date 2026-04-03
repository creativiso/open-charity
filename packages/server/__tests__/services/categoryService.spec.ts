import { createCategory } from '../../src/services/categoryService';
import { Category, sequelize, User } from '../../src/models';
import { generateSlug } from '../../src/utils';
import { ConflictError, ForbiddenError, ValidationError } from '../../src/errors';

jest.mock('../../src/models', () => ({
  Category: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
  sequelize: {
    where: jest.fn(() => ({ [Symbol('where')]: 'sequelize_where_clause' })),
    fn: jest.fn(() => 'LOWER'),
    col: jest.fn((val) => val),
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

describe('createCategory Service', () => {
  const adminUuid = 'admin-uuid';
  const createData = {
    name: 'Education',
    description: 'Educational campaigns',
  };

  const mockCategoryResponse = {
    id: 'category-uuid',
    name: 'Education',
    slug: 'education',
    description: 'Educational campaigns',
    isActive: true,
    displayOrder: 0,
  };

  const mockAdminUser = { id: adminUuid, role: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ForbiddenError if the user is not an admin', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(createCategory(createData, 'wrong-uuid')).rejects.toThrow(ForbiddenError);

    expect(Category.findOne).not.toHaveBeenCalled();
    expect(Category.create).not.toHaveBeenCalled();
  });

  it('should create a category with an auto-generated slug', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
    (Category.findOne as jest.Mock).mockResolvedValue(null);
    (Category.create as jest.Mock).mockResolvedValue(mockCategoryResponse);

    const result = await createCategory(createData, adminUuid);

    expect(User.findOne).toHaveBeenCalledWith({
      where: { id: adminUuid, role: 'admin' },
    });
    expect(Category.create).toHaveBeenCalledWith({
      ...createData,
      slug: 'education',
      isActive: true,
    });
    expect(result).toEqual(mockCategoryResponse);
  });

  it('should use the provided slug if it is valid', async () => {
    const dataWithSlug = { ...createData, slug: 'custom-slug' };
    (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
    (Category.findOne as jest.Mock).mockResolvedValue(null);
    (Category.create as jest.Mock).mockResolvedValue({
      ...mockCategoryResponse,
      slug: 'custom-slug',
    });

    await createCategory(dataWithSlug, adminUuid);

    expect(Category.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'custom-slug' }));
  });

  it('should throw ConflictError if the category name already exists', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
    (Category.findOne as jest.Mock).mockResolvedValue({ id: 'existing-id' });

    await expect(createCategory(createData, adminUuid)).rejects.toThrow(ConflictError);

    expect(Category.create).not.toHaveBeenCalled();
  });

  it('should throw ValidationError if the provided slug contains invalid characters', async () => {
    const invalidData = { ...createData, slug: 'Invalid Slug!' };
    (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
    (Category.findOne as jest.Mock).mockResolvedValue(null);

    await expect(createCategory(invalidData, adminUuid)).rejects.toThrow(ValidationError);

    expect(Category.create).not.toHaveBeenCalled();
  });

  it('should throw ValidationError if the auto-generated slug is empty/invalid', async () => {
    const badNameData = { ...createData, name: '!!!' };
    (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
    (Category.findOne as jest.Mock).mockResolvedValue(null);
    (generateSlug as jest.Mock).mockReturnValueOnce('');

    await expect(createCategory(badNameData, adminUuid)).rejects.toThrow(ValidationError);
  });
});
