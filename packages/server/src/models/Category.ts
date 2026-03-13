import { Model, DataTypes } from 'sequelize';

import sequelize from '../config/database';

import { generateSlug } from '../utils';

class Category extends Model {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare isActive: boolean;
  declare displayOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[a-z0-9-]+$/,
      },
    },
    description: {
      type: DataTypes.STRING,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeValidate: (category: Category) => {
        if (category.name && !category.slug) {
          category.slug = generateSlug(category.name);
        }
      },
      beforeUpdate: (category: Category) => {
        if (category.changed('name')) {
          category.slug = generateSlug(category.name);
        }
      },
    },
    scopes: {
      active: {
        where: {
          isActive: true,
        },
      },

      ordered: {
        order: [['displayOrder', 'ASC']],
      },
    },
    sequelize,
    modelName: 'Category',
  }
);

export default Category;
