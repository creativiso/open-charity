import { Model, DataTypes } from "sequelize";

import sequelize from "../config/database";
import Organization from "./Organization";

class Category extends Model {
    declare name: string;
    declare slug: string;

    generateSlug() {
        if (this.name && !this.slug) {
            this.slug = this.name
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^\w\-]+/g, "")
                .replace(/\-\-+/g, "-");
        }
    }
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
        scopes: {
            active: {
                where: {
                    isActive: true,
                },
            },

            ordered: {
                order: [["displayOrder", "ASC"]],
            },
        },
        sequelize,
        modelName: "Category",
    },
);

//TODO: Uncomment after having created the other models

// Category.hasMany(Campaigns)

export default Category;
