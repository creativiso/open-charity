import { Organization, OrganizationMember, sequelize } from '../models';

interface CreateOrganizationData {
  name: string;
  description: string;
  contactEmail: string;
  locationRegion: string;
  locationCity: string;
  websiteUrl?: string;
}

export const createOrganization = async (
  data: CreateOrganizationData,
  creatorUserId: string
): Promise<Organization> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    const existing = await Organization.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), data.name.toLowerCase()),
    });

    if (existing) {
      const error: any = new Error('An organization with this name already exists');
      error.status = 409;
      throw error;
    }

    if (!emailRegex.test(data.contactEmail)) {
      const error: any = new Error('Invalid contact email format');
      error.status = 400;
      throw error;
    }

    const organization = await Organization.create({ ...data, status: 'Pending' });

    await OrganizationMember.create({
      organizationId: organization.id,
      userId: creatorUserId,
      role: 'admin',
      status: 'Pending',
    });

    return (await Organization.findByPk(organization.id, {
      include: [
        {
          model: OrganizationMember,
          where: { userId: creatorUserId },
          attributes: ['role', 'status', 'joinedAt'],
        },
      ],
    }))!;
  } catch (err) {
    console.error('Create organization error:', err);
    throw err;
  }
};

export const getOrganizationById = async (id: string, includeMembers: boolean = false) => {
  const include: any[] = [];

  if (includeMembers) {
    include.push({
      model: OrganizationMember,
      attributes: ['id', 'userId', 'role', 'status', 'joinedAt'],
    });
  }

  try {
    return await Organization.findByPk(id, {
      include,
      attributes: {
        include: [[sequelize.fn('COUNT', sequelize.col('OrganizationMembers.id')), 'memberCount']],
      },
      group: ['Organization.id'],
    });
  } catch (err) {
    console.error('Could not get organization:', err);
    throw err;
  }
};
