import { Op, WhereOptions } from 'sequelize';

import {
  MembersFilters,
  CreateOrganizationData,
  SearchOrganizationsFilters,
  UpdateOrganizationData,
} from '../interfaces/organizationService.interface';

import { Organization, OrganizationMember, sequelize, User } from '../models';

import { getPagination } from '../utils';
import { Pagination } from '../types/pagination.types';

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors';

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
      throw new ConflictError('An organization with this name already exists');
    }

    if (!emailRegex.test(data.contactEmail)) {
      throw new ValidationError('Invalid contact email format');
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
      throw new NotFoundError('Could not find an organization with this ID');
    }

    if (data.name && data.name.toLowerCase() !== organization.name.toLowerCase()) {
      const existing = await Organization.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          data.name.toLowerCase()
        ),
      });

      if (existing) {
        throw new ConflictError('An organization with this name already exists');
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
      throw new NotFoundError('Organization not found');
    }

    if (organization.status !== 'Active') {
      throw new ValidationError('Organization is not active');
    }

    const existingMembership = await OrganizationMember.findOne({
      where: { userId, organizationId, status: ['Pending', 'Active'] },
    });

    if (existingMembership) {
      throw new ConflictError(
        'User is already a member of this organization or has a pending request'
      );
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
): Promise<OrganizationMember> => {
  try {
    const membership = await OrganizationMember.findByPk(membershipId);

    if (!membership) {
      throw new NotFoundError('Membership request not found');
    }

    if (membership.userId === approverUserId) {
      throw new ForbiddenError('Users cannot approve their own membership requests');
    }

    if (membership.status !== 'Pending') {
      throw new ValidationError('Membership is not in a pending state');
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

export const rejectMembership = async (
  membershipId: string,
  approverUserId: string,
  reason: string
): Promise<OrganizationMember> => {
  try {
    const membership = await OrganizationMember.findByPk(membershipId);

    if (!membership) {
      throw new NotFoundError('Membership request not found');
    }

    if (membership.userId === approverUserId) {
      throw new ForbiddenError('Users cannot reject their own membership requests');
    }

    if (membership.status !== 'Pending') {
      throw new ValidationError('Membership is not in a pending state');
    }

    await membership.update({
      status: 'Rejected',
      rejectionReason: reason,
    });

    return membership;
  } catch (err) {
    console.error('Could not reject membership:', err);
    throw err;
  }
};

export const updateMemberRole = async (
  membershipId: string,
  newRole: string,
  adminUserId: string
): Promise<OrganizationMember> => {
  try {
    const membership = await OrganizationMember.findByPk(membershipId);

    if (!membership) {
      throw new NotFoundError('Membership request not found');
    }

    const adminMembership = await OrganizationMember.findOne({
      where: {
        organizationId: membership.organizationId,
        userId: adminUserId,
        role: 'admin',
        status: 'Active',
      },
    });

    if (!adminMembership) {
      throw new ForbiddenError('You do not have admin permission in this organization');
    }

    if (!['admin', 'editor'].includes(newRole)) {
      throw new ValidationError('Invalid role, must be admin or editor');
    }

    if (membership.role === 'admin' && newRole === 'editor') {
      const adminCount = await OrganizationMember.count({
        where: {
          organizationId: membership.organizationId,
          role: 'admin',
          status: 'Active',
        },
      });

      if (adminCount <= 1) {
        throw new ValidationError('Cannot remove the last admin of the organization');
      }
    }

    await membership.update({ role: newRole });

    return membership;
  } catch (err) {
    console.error('Could not update member role:', err);
    throw err;
  }
};

export const removeMember = async (
  membershipId: string,
  adminUserId: string
): Promise<OrganizationMember> => {
  try {
    const membership = await OrganizationMember.findByPk(membershipId);

    if (!membership) {
      throw new NotFoundError('Membership request not found');
    }

    const adminMembership = await OrganizationMember.findOne({
      where: {
        organizationId: membership.organizationId,
        userId: adminUserId,
        role: 'admin',
        status: 'Active',
      },
    });

    if (!adminMembership) {
      throw new ForbiddenError('You do not have admin permission in this organization');
    }

    if (adminUserId === membership.userId) {
      throw new ForbiddenError('Admins cannot remove themselves');
    }

    const adminCount = await OrganizationMember.count({
      where: {
        organizationId: membership.organizationId,
        role: 'admin',
        status: 'Active',
      },
    });

    if (adminCount <= 1) {
      throw new ValidationError('Cannot remove the last admin of the organization');
    }

    await membership.update({ status: 'Removed' });
    return membership;
  } catch (err) {
    console.error('Could not remove member:', err);
    throw err;
  }
};

export const approveOrganization = async (
  orgId: string,
  adminUserId: string
): Promise<Organization> => {
  try {
    const adminUser = await User.findByPk(adminUserId);

    if (!adminUser) {
      throw new NotFoundError('Admin User not found');
    }

    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('You do not have permission to perform this action');
    }

    const organization = await Organization.findByPk(orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    if (organization.status !== 'Pending') {
      throw new ValidationError('Only pending organizations can be approved');
    }

    await organization.update({ status: 'Active' });

    const creatorMembership = await OrganizationMember.findOne({
      where: {
        organizationId: orgId,
        role: 'admin',
        status: 'Pending',
      },
    });

    if (creatorMembership) {
      await creatorMembership.update({
        status: 'Active',
        joinedAt: new Date(),
      });
    }

    return (await Organization.findByPk(orgId, {
      include: [
        {
          model: OrganizationMember,
          attributes: ['id', 'userId', 'role', 'status', 'joinedAt'],
          required: false,
        },
      ],
    }))!;
  } catch (error) {
    console.error('could not approve organization: ', error);
    throw error;
  }
};

export const rejectOrganization = async (orgId: string, adminUserId: string, reason: string) => {
  try {
    const adminUser = await User.findByPk(adminUserId);

    if (!adminUser) {
      throw new NotFoundError('Admin user not found');
    }

    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('You do not have permission to perform this action');
    }

    const organization = await Organization.findByPk(orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    if (organization.status !== 'Pending') {
      throw new ValidationError('Only pending organizations can be rejected');
    }

    await organization.update({ status: 'Rejected', rejectionReason: reason });

    await OrganizationMember.update(
      {
        status: 'Rejected',
        rejectionReason: reason,
      },
      {
        where: {
          organizationId: orgId,
          status: 'Pending',
        },
      }
    );

    return organization;
  } catch (error) {
    console.error('Could not reject organization: ', error);
    throw error;
  }
};

export const getOrganizationMembers = async (
  orgId: string,
  filters: MembersFilters = {}
): Promise<OrganizationMember[]> => {
  try {
    const organization = await Organization.findByPk(orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    const where: WhereOptions = { organizationId: orgId };

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return await OrganizationMember.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['joinedAt', 'ASC']],
    });
  } catch (error) {
    console.error('Could not get organization members: ', error);
    throw error;
  }
};
