import { Model, DataTypes } from "sequelize";

import sequelize from "../config/database";

import Organization from "./Organization";
import User from "./User";

class OrganizationMember extends Model {}

OrganizationMember.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        organizationId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Organization,
                key: "id",
            },
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        role: {
            type: DataTypes.ENUM("admin", "editor"),
            defaultValue: "editor",
        },
        status: {
            type: DataTypes.ENUM("Pending", "Active", "Rejected"),
            defaultValue: "Pending",
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
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
            admins: {
                where: {
                    role: "admin",
                },
            },
            editors: {
                where: {
                    role: "editor",
                },
            },
        },
        sequelize,
        modelName: "OrganizationMember",
    },
);

OrganizationMember.belongsTo(Organization);
OrganizationMember.belongsTo(User);
