import { Request, Response, NextFunction } from 'express';
import { Campaign, Organization } from '../models';

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
  } catch (error) {
    next(error);
  }
};
