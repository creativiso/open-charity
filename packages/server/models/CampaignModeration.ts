import { Model, DataTypes } from "sequelize";

import sequelize from "../config/database";

import Campaign from "./Campaign";
import User from "./User";

class CampaignModeration extends Model {
    declare id: string;
    declare campaignId: string;
    declare moderatedByUserId: string;
    declare action: 'approved' | 'rejected' | 'hidden' | 'ended';
    declare moderationNote: string | null;
    declare moderatedAt: Date;
    declare readonly createdAt: Date;
}

CampaignModeration.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        campaignId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        moderatedByUserId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        action: {
            type: DataTypes.ENUM('approved', 'rejected', 'hidden', 'ended'),
            allowNull: false,
            validate: {
                isIn: [['approved', 'rejected', 'hidden', 'ended']],
            },
        },
        moderationNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        moderatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,  
        modelName: "CampaignModeration",
        timestamps: true,
        scopes: {
            recent: {
                order: [["moderatedAt", "DESC"]],
            },
        },
    }
);

//TODO: Uncomment after having created the other models

// CampaignModeration.belongsTo(Campaign, { foreignKey: 'campaignId' });
// CampaignModeration.belongsTo(User, { as: 'moderator', foreignKey: 'moderatedByUserId' });

export default CampaignModeration;