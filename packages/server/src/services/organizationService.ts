import { Op, WhereOptions } from 'sequelize';

import { Organization, OrganizationMember, sequelize } from '../models';

import {
  CreateOrganizationData,
  SearchOrganizationsFilters,
  UpdateOrganizationData,
} from '../types/organization.types';

import { getPagination } from '../utils';
import { Pagination } from '../types/pagination.types';

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
  pagination: Pagination = {}
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

export const requestMembership = async (
  userId: string,
  organizationId: string
): Promise<OrganizationMember> => {
  try {
    const organization = await Organization.findByPk(organizationId);

    if (!organization) {
      const error: any = new Error('Organization not found');
      error.status = 404;
      throw error;
    }

    if (organization.status !== 'Active') {
      const error: any = new Error('Organization is not active');
      error.status = 400;
      throw error;
    }

    const existingMembership = await OrganizationMember.findOne({
      where: { userId, organizationId, status: ['Pending', 'Active'] },
    });

    if (existingMembership) {
      const error: any = new Error(
        'User is already a member of this organization or has a pending request'
      );
      error.status = 409;
      throw error;
    }

    return await OrganizationMember.create({
      userId,
      organizationId,
      role: 'editor',
      status: 'Pending',
      joinedAt: new Date(),
    });
  } catch (err) {
    console.error('Could not request membership:', err);
    throw err;
  }
};

export const approveMembership = async (
  membershipId: string,
  approverUserId: string
): Promise<any> => {
  try {
    const membership = await OrganizationMember.findByPk(membershipId);

    if (!membership) {
      const error: any = new Error('Membership request not found');
      error.status = 404;
      throw error;
    }

    if (membership.userId == approverUserId) {
      const error: any = new Error('Users cannot approve their own membership requests');
      error.status = 403;
      throw error;
    }

    if (membership.status !== 'Pending') {
      const error: any = new Error('Membership is not in a pending state');
      error.status = 400;
      throw error;
    }

    await membership.update({
      status: 'Active',
      joinedAt: new Date(),
    });

    console.log('Membership approved');

    return membership;
  } catch (err) {
    console.error('Could not approve membership:', err);
    throw err;
  }
};
