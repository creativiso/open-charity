import { Model, DataTypes } from "sequelize";

import sequelize from "../config/database";

import { generateSlug } from "../utils";

class Organization extends Model {
    declare id: string;
    declare name: string;
    declare slug: string;
    declare description: string;
    declare websiteUrl: string | null;
    declare contactEmail: string;
    declare locationRegion: string;
    declare locationCity: string;
    declare isVerified: boolean;
    declare status: "Pending" | "Active" | "Rejected";
}

Organization.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [3, 80],
            },
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        websiteUrl: {
            type: DataTypes.STRING,
            validate: {
                isUrl: {
                    msg: "Invalid website URL",
                },
            },
        },
        contactEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: {
                    msg: "invalid email",
                },
                notEmpty: {
                    msg: "Email cannot be empty",
                },
            },
        },
        locationRegion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        locationCity: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type: DataTypes.ENUM("Pending", "Active", "Rejected"),
            defaultValue: "Pending",
        },
    },
    {
        timestamps: true,
        hooks: {
            beforeValidate: (org: Organization) => {
                if (org.name && !org.slug) {
                    org.slug = generateSlug(org.name);
                }
            },
        },
        scopes: {
            active: {
                where: {
                    status: "Active",
                },
            },
            pending: {
                where: {
                    status: "Pending",
                },
            },
            byRegion(regionValue) {
                return {
                    where: {
                        locationRegion: regionValue,
                    },
                };
            },
        },
        sequelize,
        modelName: "Organization",
    },
);

export default Organization;
