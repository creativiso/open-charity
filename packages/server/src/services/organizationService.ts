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
import { fileURLToPath } from 'url';

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

//like approve membership
// Implement approveOrganization(orgId, adminUserId):
// Validate organization is Pending
// Update status to 'Active'
// Auto-approve creator's membership
// Return updated organization

//like reject membership
// Implement rejectOrganization(orgId, adminUserId, reason):
// Update status to 'Rejected'
// Store rejection reason
// Reject all pending memberships

// export const rejectOrganization = async (
//   orgId: string,
//   adminUserId: string,
//   reason: string
// ): Promise<Organization> => {
//   try {
//     const organization = await Organization.findByPk(orgId);

//     if (!organization) {
//       const error: any = new Error('Could not find an organization with this ID');
//       error.status = 404;
//       throw error;
//     }

//     if (organization.status !== 'Pending') {
//       const error: any = new Error('Only pending organizations can be rejected');
//       error.status = 400;
//       throw error;
//     }

//     // --- USE adminUserId HERE ---
//     // Check if the user performing the rejection is an active Admin
//     const adminMembership = await OrganizationMember.findOne({
//       where: {
//         userId: adminUserId,
//         role: 'admin',
//         status: 'Active'
//       }
//     });

//     if (!adminMembership) {
//       const error: any = new Error('Unauthorized to reject this organization');
//       error.status = 403;
//       throw error;
//     }

//     // 1. Update Organization
//     await organization.update({
//       status: 'Rejected',
//       rejectionReason: reason // Make sure this is in your model!
//     });

//     // 2. Update Memberships
//     await OrganizationMember.update(
//       { status: 'Rejected' },
//       {
//         where: { organizationId: orgId, status: 'Pending' }
//       }
//     );

//     return organization;
//   } catch (error) {
//     console.error('Could not reject organization: ', error);
//     throw error;
//   }
// };

// Implement getOrganizationMembers(orgId, filters):
// Load members with user info
// Filter by role, status
// Return members list

export const getOrganizationMembers = async (
  orgId: string,
  filters: MembersFilters = {}
): Promise<OrganizationMember[]> => {
  try {
    const organization = await Organization.findByPk(orgId);

    if (!organization) {
      const error: any = new Error('Organization not found');
      error.status = 404;
      throw error;
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

// export const getOrganizationMembers = async (
//   orgId: string,
//   filters: any = {}
// ) => {
//   try {
//     const whereClause: any = { organizationId: orgId };

//     if (filters.role)
//     {
//       whereClause.role = filters.role;
//     }

//     if (filters.status)
//     {
//       whereClause.status = filters.status;
//     }

//     const members = await OrganizationMember.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: User,
//           attributes: ['id', 'firstName', 'lastName', 'email'],
//         },
//       ],
//       order: [['createdAt', 'ASC']],
//     });

//     return members;
//   } catch (error) {
//     console.error('Could not fetch organization members: ', error);
//     throw error;
//   }
// };
