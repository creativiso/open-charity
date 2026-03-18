import { Op, WhereOptions } from 'sequelize';

import { Organization, OrganizationMember, sequelize } from '../models';

import { getPagination } from '../utils';

interface CreateOrganizationData {
  name: string;
  description: string;
  contactEmail: string;
  locationRegion: string;
  locationCity: string;
  websiteUrl?: string;
}

interface UpdateOrganizationData {
  name?: string;
  description?: string;
  contactEmail?: string;
  locationRegion?: string;
  locationCity?: string;
  websiteUrl?: string;
}

interface SearchOrganizationsFilters {
  region?: string;
  city?: string;
  status?: string;
  search?: string;
}

interface pagination {
  page?: number;
  limit?: number;
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
  try {
    return await Organization.findByPk(id, {
      include: includeMembers
        ? [
            {
              model: OrganizationMember,
              attributes: ['id', 'userId', 'role', 'status', 'joinedAt'],
              required: false,
            },
          ]
        : [],
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM OrganizationMembers WHERE OrganizationMembers.organizationId = Organization.id)'
            ),
            'memberCount',
          ],
        ],
      },
    });
  } catch (err) {
    console.error('Could not get organization:', err);
    throw err;
  }
};

export const updateOrganization = async (
  id: string,
  data: UpdateOrganizationData
): Promise<Organization> => {
  try {
    const organization = await Organization.findByPk(id);

    if (!organization) {
      const error: any = new Error('Could not find an organization with this ID');
      error.status = 404;
      throw error;
    }

    if (data.name && data.name.toLowerCase() !== organization.name.toLowerCase()) {
      const existing = await Organization.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          data.name.toLowerCase()
        ),
      });

      if (existing) {
        const error: any = new Error('An organization with this name already exists');
        error.status = 409;
        throw error;
      }
    }

    await organization.update(data);

    return organization;
  } catch (err) {
    console.error('Could not update organization:', err);
    throw err;
  }
};

export const searchOrganizations = async (
  filters: SearchOrganizationsFilters = {},
  pagination: pagination = {}
) => {
  try {
    const { limit, offset } = getPagination(pagination.page, pagination.limit);

    const where: WhereOptions = {};

    if (filters.region) {
      where.locationRegion = filters.region;
    }

    if (filters.city) {
      where.locationCity = filters.city;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.name = { [Op.like]: `%${filters.search}%` };
    }

    const { count, rows } = await Organization.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      organizations: rows,
      total: count,
      page: pagination.page || 1,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (err) {
    console.error('Could not get organizations:', err);
    throw err;
  }
};
