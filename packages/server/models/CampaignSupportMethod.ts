import { Model, DataTypes } from "sequelize";

import sequelize from "../config/database";

class CampaignSupportMethod extends Model {
    declare id: string;
    declare campaignId: string;
    declare donationLink: string | null;
    declare donationInfo: string | null;
    declare volunteerInfo: string | null;
    declare volunteerLink: string | null;
    declare otherSupportInfo: string | null;
    declare otherSupportLink: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public hasAtLeastOneMethod(): boolean {
        const fields = [
            this.donationLink,
            this.donationInfo,
            this.volunteerInfo,
            this.volunteerLink,
            this.otherSupportInfo,
            this.otherSupportLink,
        ];
        return fields.some(
            (field) => field !== null && field !== undefined && field !== "",
        );
    }
}

CampaignSupportMethod.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        campaignId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        donationLink: {
            type: DataTypes.STRING,
            validate: {
                isUrl: true,
            },
        },
        donationInfo: {
            type: DataTypes.TEXT,
        },
        volunteerInfo: {
            type: DataTypes.TEXT,
        },
        volunteerLink: {
            type: DataTypes.STRING,
            validate: {
                isUrl: true,
            },
        },
        otherSupportInfo: {
            type: DataTypes.TEXT,
        },
        otherSupportLink: {
            type: DataTypes.STRING,
            validate: {
                isUrl: true,
            },
        },
    },
    {
        sequelize,
        modelName: "CampaignSupportMethod",
        timestamps: true,
        validate: {
            atLeastOneFieldRequired() {
                if (
                    !this.donationLink &&
                    !this.donationInfo &&
                    !this.volunteerInfo &&
                    !this.volunteerLink &&
                    !this.otherSupportInfo &&
                    !this.otherSupportLink
                ) {
                    throw new Error(
                        "At least one support method (link or info) must be provided.",
                    );
                }
            },
        },
    },
);

export default CampaignSupportMethod;
