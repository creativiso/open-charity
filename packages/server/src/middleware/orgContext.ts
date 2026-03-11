import { Request, Response, NextFunction } from 'express';
import OrganizationMember from '../models/OrganizationMember';
import { Organization } from '../models';

export const loadUserOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: true, message: 'Not authenticated!' });
    return;
  }
  try {
    //console.log(req.user);
    const memberships = await OrganizationMember.findAll({
      where: {
        userId: req.user.id,
        status: 'Active',
      },
      include: {
        model: Organization,
      },
    });
    //console.log(memberships);

    req.userOrganizations = memberships.map((m: any) => m.Organization);
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: 'Error loading organizations' });
  }
};

const getActiveMembership = (
  userId: string,
  organizationId: string
): Promise<OrganizationMember | null> => {
  return OrganizationMember.findOne({
    where: {
      userId,
      organizationId,
      status: 'Active',
    },
  });
};

export const requireOrgEditor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: true, message: 'Not authenticated!' });
    return;
  }

  const organizationId = req.params.organizationId as string;

  if (!organizationId) {
    res.status(400).json({ error: true, message: 'Organization ID is required!' });
    return;
  }

  try {
    const membership = await getActiveMembership(req.user.id, organizationId);

    if (!membership) {
      res.status(403).json({ error: true, message: 'You are not a member of this organization!' });
      return;
    }

    const roles = ['editor', 'admin'];

    if (!roles.includes(membership.role)) {
      res.status(403).json({ error: true, message: 'Only editor or admin can access!' });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message });
  }
};

export const requireOrgAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: true, message: 'Not authenticated!' });
    return;
  }

  const organizationId = req.params.organizationId as string;
  //console.log(organizationId);

  if (!organizationId) {
    res.status(400).json({ error: true, message: 'Organization ID is required!' });
    return;
  }

  try {
    const membership = await getActiveMembership(req.user.id, organizationId);
    //console.log(membership);

    if (!membership) {
      res.status(403).json({ error: true, message: 'You are not a member of this organziaton!' });
      return;
    }

    if (membership.role !== 'admin') {
      res.status(403).json({ error: true, message: 'Only admin can access!' });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message });
  }
};
