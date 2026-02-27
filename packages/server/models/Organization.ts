import { Model, DataTypes } from "sequelize";

import sequelize from "../config/database";
import User from "./User";

class Organization extends Model {}

Organization.init(
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [3, 80],
            },
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
            defaultValue: "false",
        },
        status: {
            type: DataTypes.ENUM("Pending", "Active", "Rejected"),
            defaultValue: "Pending",
        },
    },
    {
        timestamps: true,
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

//TODO: Uncomment after having created the other models

// Organization.hasMany(OrganizationMember);
// Organization.hasMany(Campaign);
// Organization.belongsToMany(User, {
//     through: OrganizationMember,
//     foreignKey: 'organizationId'
// })

export default Organization;
