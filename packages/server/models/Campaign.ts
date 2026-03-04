import { Model, DataTypes, Op } from "sequelize";

import sequelize from "../config/database";

import Organization from "./Organization";
import Category from "./Category";
import User from "./User";
// import CampaignSupportMethod from "./CampaignSupportMethod";
// import CampaignEvent from "./CampaignEvent";
// import CampaignModeration from "./CampaignModeration";

class Campaign extends Model {
    declare id: string;
    declare organizationId: string;
    declare title: string;
    declare summary: string;
    declare description: string;
    declare categoryId: string;
    declare locationRegion: string;
    declare locationCity: string;
    declare status: 'Pending' | 'Active' | 'Expired' | 'Ended' | 'Rejected' | 'Hidden';
    declare deadlineAt: Date;
    declare coverImageUrl: string;
    declare createdByUserId: string;
    declare deletedAt: Date | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public isExpired(): boolean {
        return new Date() > this.deadlineAt;
    }

    public async softDelete(): Promise<void> {
        this.deletedAt = new Date();
        await this.save();
    }

    public async restoreRecord(): Promise<void> {
        this.deletedAt = null;
        await this.save();
    }
}

Campaign.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        organizationId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [3, 255],
            },
        },
        summary: {
            type: DataTypes.STRING(250),
            allowNull: false,
            validate: {
                len: [1, 250],
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        locationRegion: {
            type: DataTypes.STRING,
        },
        locationCity: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Active', 'Expired', 'Ended', 'Rejected', 'Hidden'),
            defaultValue: 'Pending',
            validate: {
                isIn: [['Pending', 'Active', 'Expired', 'Ended', 'Rejected', 'Hidden']],
            },
        },
        deadlineAt: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: true,
                isAfterNow(value: Date) {
                    if (this.isNewRecord && value <= new Date()) {
                        throw new Error("Deadline must be a future date.");
                    }
                },
            },
        },
        coverImageUrl: {
            type: DataTypes.STRING,
            validate: {
                isUrl: true,
            },
        },
        createdByUserId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "Campaign",
        timestamps: true,
        paranoid: true,
        scopes: {
            active: {
                where: {
                    status: 'Active',
                    deletedAt: null,
                },
            },
            notExpired: {
                where: {
                    status: { [Op.ne]: 'Expired' },
                    deletedAt: null,
                },
            },
            notDeleted: {
                where: {
                    deletedAt: null,
                },
            },
            byStatus(status: string) {
                return {
                    where: { status },
                };
            },
            byOrganization(organizationId: string) {
                return {
                    where: { organizationId },
                };
            },
            byCategory(categoryId: string) {
                return {
                    where: { categoryId },
                };
            },
        },
    }
);

//TODO: Uncomment after having created the other models
// Campaign.belongsTo(Organization);
// Campaign.belongsTo(Category);
// Campaign.belongsTo(User, { as: 'creator', foreignKey: 'createdByUserId' });
// Campaign.hasOne(CampaignSupportMethod);
// Campaign.hasOne(CampaignEvent);
// Campaign.hasMany(CampaignModeration);

export default Campaign;