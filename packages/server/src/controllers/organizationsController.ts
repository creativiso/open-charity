import { Request, Response, NextFunction } from 'express';
import { Campaign, Organization, OrganizationMember, User } from '../models';
import { getPagination } from '../utils';
import { Op } from 'sequelize';
import { validationResult } from 'express-validator';
import {
  createOrganization,
  getOrganizationMembers,
  removeMember,
  requestMembership,
  updateMemberRole,
} from '../services/organizationService';

export const getOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { region, city, search } = req.query;

    const queryPage = req.query.page as string;
    const queryLimit = req.query.limit as string;

    const page = Math.max(1, parseInt(queryPage) || 1);
    const limit = Math.min(50, parseInt(queryLimit) || 10);
    const { limit: parsedLimit, offset } = getPagination(page, limit);

    const { rows: organizations, count: total } = await Organization.findAndCountAll({
      where: {
        status: 'Active',
        ...(region && { locationRegion: { [Op.substring]: region } }),
        ...(city && { locationCity: { [Op.substring]: city } }),
        ...(search && {
          [Op.or]: [
            { name: { [Op.substring]: search } },
            { description: { [Op.substring]: search } },
          ],
        }),
      },
      order: [['name', 'ASC']],
      attributes: [
        'id',
        'name',
        'slug',
        'description',
        'locationRegion',
        'locationCity',
        'createdAt',
      ],
      limit: parsedLimit,
      offset,
    });

    if (organizations.length < 1) {
      res.status(404).json({ message: 'No organizations found' });
      return;
    }

    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          total,
          page,
          limit: parsedLimit,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getOrganizationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const organization = await Organization.findOne({
      where: {
        id,
        status: 'Active',
      },
      attributes: [
        'id',
        'name',
        'slug',
        'description',
        'websiteUrl',
        'contactEmail',
        'locationRegion',
        'locationCity',
        'isVerified',
        'status',
        'createdAt',
      ],
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    const activeCampaignsCount = await Campaign.count({
      where: {
        organizationId: organization.id,
        status: 'Active',
      },
    });

    res.json({
      success: true,
      data: {
        ...organization.toJSON(),
        activeCampaignsCount,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getOrganizationCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const status = req.query.status as string;
    const queryPage = req.query.page as string;
    const queryLimit = req.query.limit as string;

    const page = Math.max(1, parseInt(queryPage) || 1);
    const limit = Math.min(50, parseInt(queryLimit) || 10);

    const { limit: parsedLimit, offset } = getPagination(page, limit);

    const organization = await Organization.findOne({
      where: {
        id,
        status: 'Active',
      },
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    const { rows: campaigns, count: total } = await Campaign.findAndCountAll({
      where: {
        organizationId: id,
        ...(status ? { status } : { status: { [Op.notIn]: ['Expired'] } }),
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'slug', 'description', 'status', 'createdAt'],
      limit: parsedLimit,
      offset,
    });

    res.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
        },
        campaigns,
        pagination: {
          total,
          page,
          limit: parsedLimit,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createUserOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, description, websiteUrl, contactEmail, locationRegion, locationCity } = req.body;

    const organization = await createOrganization(
      {
        name,
        description,
        websiteUrl,
        contactEmail,
        locationRegion,
        locationCity,
      },
      req.user!.id
    );

    res.status(201).json({ message: 'Organization created successfully', data: { organization } });
  } catch (error: any) {
    console.error('Create organization error:', error);
    next(error);
  }
};

export const joinOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const organization = await Organization.findOne({
      where: {
        id,
        status: 'Active',
      },
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    const membership = await requestMembership(userId, id);

    res.status(201).json({
      message: 'Membership request submitted successfully',
      data: membership,
    });
  } catch (error: any) {
    if (error.name === 'ConflictError') {
      res.status(409).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
    next(error);
  }
};

export const getMyOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id as string;

    const organizations = await Organization.findAll({
      attributes: ['id', 'name', 'slug', 'description', 'locationRegion', 'locationCity'],
      include: [
        {
          model: OrganizationMember,
          where: { userId },
          attributes: ['id', 'role', 'status', 'joinedAt'],
        },
      ],
      order: [['name', 'DESC']],
    });

    res.json({
      data: organizations,
    });
  } catch (error: any) {
    // console.error('Error fetching user organizations:', error);
    next(error);
  }
};

export const getMembersInOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const members = await getOrganizationMembers(id);

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateRoleOfMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    const membership = await OrganizationMember.findOne({
      where: {
        userId: memberId,
        organizationId: id,
      },
    });

    if (!membership) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    const validRoles = ['admin', 'editor'];

    if (!validRoles.includes(role)) {
      res.status(400).json({ error: true, message: 'Invalid role specified' });
      return;
    }

    const updatedMember = await updateMemberRole(membership.id, role, req.user!.id);

    console.log(updatedMember);

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: updatedMember,
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;

    const membership = await OrganizationMember.findOne({
      where: {
        userId: memberId,
        organizationId: id,
      },
    });

    if (!membership) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    const deletedMember = await removeMember(membership.id, req.user!.id);

    res.status(204).json({
      success: true,
      message: 'Member removed successfully',
      data: deletedMember,
    });
  } catch (error: any) {
    next(error);
  }
};
