import sequelize from '../config/database';

import User from './User';
import Organization from './Organization';
import OrganizationMember from './OrganizationMember';
import Category from './Category';
import Campaign from './Campaign';
import CampaignSupportMethod from './CampaignSupportMethod';
import CampaignEvent from './CampaignEvent';
import CampaignModeration from './CampaignModeration';

User.hasMany(OrganizationMember, {
  foreignKey: 'userId',
});
User.hasMany(Campaign, {
  foreignKey: 'creatorId',
  as: 'createdCampaigns',
});

Organization.hasMany(OrganizationMember, {
  foreignKey: 'organizationId',
});
Organization.hasMany(Campaign, {
  foreignKey: 'organizationId',
});
Organization.belongsToMany(User, {
  through: OrganizationMember,
  foreignKey: 'organizationId',
  otherKey: 'userId',
});

OrganizationMember.belongsTo(Organization, {
  foreignKey: 'organizationId',
});
OrganizationMember.belongsTo(User, {
  foreignKey: 'userId',
});

Category.hasMany(Campaign, {
  foreignKey: 'categoryId',
});

Campaign.belongsTo(Organization, {
  foreignKey: 'organizationId',
});
Campaign.belongsTo(Category, {
  foreignKey: 'categoryId',
});
Campaign.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Campaign.hasOne(CampaignSupportMethod, {
  foreignKey: 'campaignId',
});
Campaign.hasOne(CampaignEvent, {
  foreignKey: 'campaignId',
});
Campaign.hasMany(CampaignModeration, {
  foreignKey: 'campaignId',
});

CampaignSupportMethod.belongsTo(Campaign, { foreignKey: 'campaignId' });

CampaignEvent.belongsTo(Campaign, { foreignKey: 'campaignId' });

CampaignModeration.belongsTo(Campaign, { foreignKey: 'campaignId' });
CampaignModeration.belongsTo(User, {
  as: 'moderator',
  foreignKey: 'moderatedByUserId',
});

export {
  sequelize,
  User,
  Organization,
  OrganizationMember,
  Category,
  Campaign,
  CampaignSupportMethod,
  CampaignEvent,
  CampaignModeration,
};
