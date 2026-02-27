import { Model, DataTypes } from "sequelize";
import bcrypt from "bcrypt";

import sequelize from "../config/database";

class User extends Model {
    declare id: string;
    declare name: string;
    declare email: string;
    declare passwordHash: string;
    declare role: "admin" | "user";

    async validatePassword(password: string) {
        return await bcrypt.compare(password, this.passwordHash);
    }

    toJSON() {
        const values: any = { ...this.get() };
        delete values.passwordHash;
        return values;
    }
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("admin", "user"),
            defaultValue: "user",
        },
    },
    {
        timestamps: true,
        scopes: {
            admins: {
                where: {
                    role: "admin",
                },
            },
        },
        sequelize,
        modelName: "User",
    },
);

//TODO: Uncomment after having created the other models

// User.hasMany(OrganizationMember, {
//     foreignKey: "userId",
// });

// User.hasMany(Campaign, {
//     foreignKey: "creatorId",
//     as: "createdCampaigns",
// });

export default User;
