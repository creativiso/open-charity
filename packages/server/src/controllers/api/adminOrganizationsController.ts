import { Request, Response } from 'express';
import {
  approveOrganization,
  rejectOrganization,
  searchOrganizations,
  updateOrganization,
} from '../../services/organizationService';
import { UpdateOrganizationData } from '../../interfaces/organizationService.interface';
import { handleError } from '../../utils';

export const getPendingOrganizations = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);

    const pendingOrganizations = await searchOrganizations({ status: 'Pending' }, { page, limit });

    res.status(200).json(pendingOrganizations);
  } catch (err) {
    console.error('Getting pending organizations failed:' + err);
    handleError(err, res);
  }
};

export const approveOrg = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.id as string;
    const adminId = req.user!.id;

    const approvedOrganization = await approveOrganization(organizationId, adminId);

    res.status(200).json(approvedOrganization);
  } catch (err) {
    console.error('Could not approve organization:' + err);
    handleError(err, res);
  }
};

export const rejectOrg = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.id as string;
    const adminId = req.user!.id;
    const rejectionReason = req.body?.rejectionReason;

    if (!rejectionReason) {
      res.status(400).json({ error: true, message: 'Rejection reason is required' });
      return;
    }

    const rejectedOrganization = await rejectOrganization(organizationId, adminId, rejectionReason);

    res.status(200).json(rejectedOrganization);
  } catch (err) {
    console.error('Could not reject organization:' + err);
    handleError(err, res);
  }
};

export const updateOrg = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.id as string;
    const updatedData: UpdateOrganizationData = req.body;

    const updatedOrganization = await updateOrganization(organizationId, updatedData);

    res.status(200).json(updatedOrganization);
  } catch (err) {
    console.error('Could not update organization:' + err);
    handleError(err, res);
  }
};
