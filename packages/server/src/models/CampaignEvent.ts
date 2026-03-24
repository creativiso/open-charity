import { Model, DataTypes } from 'sequelize';

import sequelize from '../config/database';

import Campaign from './Campaign';

class CampaignEvent extends Model {
  declare id: string;
  declare campaignId: string;
  declare eventDateTime: Date;
  declare eventLocation: string;
  declare eventInfo: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CampaignEvent.init(
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
    eventDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    eventLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventInfo: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'CampaignEvent',
    timestamps: true,
    hooks: {
      beforeValidate: async (event: CampaignEvent) => {
        if (event.campaignId && event.eventDateTime) {
          const campaign = await Campaign.findByPk(event.campaignId);

          if (!campaign) {
            throw new Error('Associated campaign not found.');
          }

          if (event.eventDateTime > campaign.deadlineAt) {
            throw new Error('Event date/time cannot be later than the campaign deadline.');
          }
        }
      },
    },
  }
);

export default CampaignEvent;
