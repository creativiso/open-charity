import { Organization, OrganizationMember, sequelize, User } from '../../src/models';

import {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganizations,
  getOrganizationMembers,
  approveOrganization,
  rejectOrganization,
} from '../../src/services/organizationService';

// Replace real models with fakes
jest.mock('../../src/models', () => ({
  Organization: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  OrganizationMember: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  sequelize: {
    where: jest.fn(),
    fn: jest.fn(),
    col: jest.fn(),
    literal: jest.fn(),
  },
}));

jest.mock('../../src/utils', () => ({
  getPagination: jest.fn().mockReturnValue({ limit: 10, offset: 0 }),
}));

const mockOrganization = {
  id: 'org-uuid',
  name: 'Red Cross',
  description: 'Humanitarian org',
  contactEmail: 'contact@redcross.bg',
  locationRegion: 'Sofia',
  locationCity: 'Sofia',
  status: 'Pending',
  update: jest.fn(),
};

const mockAdminUser = {
  id: 'admin-uuid',
  name: 'admin',
  email: 'admin@admin.com',
  role: 'admin',
};

const mockMembers = [
  {
    id: 'member-1-uuid',
    userId: 'user-1-uuid',
    role: 'admin',
    status: 'Active',
    User: {
      id: 'user-1-uuid',
      firstName: 'Elena',
      lastName: 'Stoeva',
      email: 'elena@example.com',
    },
  },
  {
    id: 'member-2-uuid',
    userId: 'user-2-uuid',
    role: 'editor',
    status: 'Active',
    User: {
      id: 'user-2-uuid',
      firstName: 'Nikol',
      lastName: 'Ivanova',
      email: 'nikol@example.com',
    },
  },
  {
    id: 'member-3-uuid',
    userId: 'user-3-uuid',
    role: 'editor',
    status: 'Pending',
    User: {
      id: 'user-3-uuid',
      firstName: 'Stoyan',
      lastName: 'Kolev',
      email: 'stoyan@example.com',
    },
  },
];

describe('organizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // reset all mocks before each test
  });

  // ─── createOrganization ───────────────────────────────────────────

  describe('createOrganization', () => {
    const createData = {
      name: 'Red Cross',
      description: 'Humanitarian org',
      contactEmail: 'contact@redcross.bg',
      locationRegion: 'Sofia',
      locationCity: 'Sofia',
    };

    it('should create an organization and return it with membership', async () => {
      (Organization.findOne as jest.Mock).mockResolvedValue(null); // no duplicate
      (Organization.create as jest.Mock).mockResolvedValue(mockOrganization);
      (OrganizationMember.create as jest.Mock).mockResolvedValue({});
      (Organization.findByPk as jest.Mock).mockResolvedValue({
        ...mockOrganization,
        OrganizationMembers: [{ role: 'admin', status: 'Pending' }],
      });

      const result = await createOrganization(createData, 'user-uuid');

      expect(Organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Pending' })
      );
      expect(OrganizationMember.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin', userId: 'user-uuid' })
      );
      expect(result).toHaveProperty('OrganizationMembers');
    });

    it('should throw 409 if organization name already exists', async () => {
      (Organization.findOne as jest.Mock).mockResolvedValue(mockOrganization); // duplicate found

      await expect(createOrganization(createData, 'user-uuid')).rejects.toMatchObject({
        message: 'An organization with this name already exists',
        status: 409,
      });

      expect(Organization.create).not.toHaveBeenCalled();
    });

    it('should throw 400 if contact email is invalid', async () => {
      (Organization.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        createOrganization({ ...createData, contactEmail: 'not-an-email' }, 'user-uuid')
      ).rejects.toMatchObject({
        message: 'Invalid contact email format',
        status: 400,
      });

      expect(Organization.create).not.toHaveBeenCalled();
    });
  });

  // ─── getOrganizationById ──────────────────────────────────────────

  describe('getOrganizationById', () => {
    it('should return organization without members by default', async () => {
      (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);

      const result = await getOrganizationById('org-uuid');

      expect(Organization.findByPk).toHaveBeenCalledWith(
        'org-uuid',
        expect.objectContaining({ include: [] })
      );
      expect(result).toEqual(mockOrganization);
    });

    it('should return organization with members when includeMembers is true', async () => {
      const orgWithMembers = {
        ...mockOrganization,
        OrganizationMembers: [{ id: 'member-uuid', role: 'admin' }],
      };
      (Organization.findByPk as jest.Mock).mockResolvedValue(orgWithMembers);

      const result = await getOrganizationById('org-uuid', true);

      expect(Organization.findByPk).toHaveBeenCalledWith(
        'org-uuid',
        expect.objectContaining({
          include: expect.arrayContaining([expect.objectContaining({ model: OrganizationMember })]),
        })
      );
      expect(result).toHaveProperty('OrganizationMembers');
    });

    it('should return null if organization not found', async () => {
      (Organization.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getOrganizationById('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  // ─── updateOrganization ───────────────────────────────────────────

  describe('updateOrganization', () => {
    it('should update and return the organization', async () => {
      (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);

      const result = await updateOrganization('org-uuid', { locationCity: 'Plovdiv' });

      expect(mockOrganization.update).toHaveBeenCalledWith({ locationCity: 'Plovdiv' });
      expect(result).toEqual(mockOrganization);
    });

    it('should throw 404 if organization not found', async () => {
      (Organization.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(updateOrganization('bad-uuid', { name: 'New Name' })).rejects.toMatchObject({
        message: 'Could not find an organization with this ID',
        status: 404,
      });
    });

    it('should throw 409 if new name already taken', async () => {
      (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
      (Organization.findOne as jest.Mock).mockResolvedValue({ id: 'other-org', name: 'New Name' });

      await expect(updateOrganization('org-uuid', { name: 'New Name' })).rejects.toMatchObject({
        message: 'An organization with this name already exists',
        status: 409,
      });
    });

    it('should skip name uniqueness check if name is unchanged', async () => {
      (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);

      await updateOrganization('org-uuid', { name: 'Red Cross' }); // same name

      expect(Organization.findOne).not.toHaveBeenCalled();
    });
  });

  // ─── searchOrganizations ──────────────────────────────────────────

  describe('searchOrganizations', () => {
    it('should return paginated organizations', async () => {
      (Organization.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockOrganization],
        count: 1,
      });

      const result = await searchOrganizations({}, { page: 1, limit: 10 });

      expect(result).toEqual({
        organizations: [mockOrganization],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply region filter', async () => {
      (Organization.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      await searchOrganizations({ region: 'Sofia' });

      expect(Organization.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ locationRegion: 'Sofia' }),
        })
      );
    });

    it('should return empty results when nothing matches', async () => {
      (Organization.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const result = await searchOrganizations({ search: 'nonexistent' });

      expect(result.total).toBe(0);
      expect(result.organizations).toHaveLength(0);
    });
  });
});

// approveOrganization

describe('approveOrganization', () => {
  const orgId = 'org-uuid';
  const adminUserId = 'admin-uuid';

  const mockCreatorMembership = {
    id: 'membership-uuid',
    organizationId: orgId,
    userId: 'creator-uuid',
    role: 'admin',
    status: 'Pending',
    update: jest.fn().mockImplementation((data: any) => {
      Object.assign(mockCreatorMembership, data);
      return Promise.resolve(mockCreatorMembership);
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should approve a pending organization and auto-approve creator membership', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockAdminUser);
    (Organization.findByPk as jest.Mock)
      .mockResolvedValueOnce(mockOrganization)
      .mockResolvedValueOnce({
        ...mockOrganization,
        status: 'Active',
        OrganizationMembers: [{ ...mockCreatorMembership, status: 'Active' }],
      });
    (OrganizationMember.findOne as jest.Mock).mockResolvedValue(mockCreatorMembership);

    const result = await approveOrganization(orgId, adminUserId);

    expect(mockOrganization.update).toHaveBeenCalledWith({ status: 'Active' });
    expect(mockCreatorMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Active', joinedAt: expect.any(Date) })
    );
    expect(result).toHaveProperty('OrganizationMembers');
    expect(result.status).toBe('Active');
  });

  it('should throw 404 if admin user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(approveOrganization(orgId, 'not-admin-uuid')).rejects.toMatchObject({
      message: 'Admin User not found',
      status: 404,
    });

    expect(Organization.findByPk).not.toHaveBeenCalled();
  });

  it('should throw 403 if user does not have admin role', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
      id: 'other-user',
      role: 'user',
    });

    await expect(approveOrganization(orgId, 'other-user')).rejects.toMatchObject({
      message: 'You do not have permission to perform this action',
      status: 403,
    });

    expect(Organization.findByPk).not.toHaveBeenCalled();
    expect(mockOrganization.update).not.toHaveBeenCalled();
  });

  it('should throw 404 if organization does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockAdminUser);
    (Organization.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(approveOrganization(orgId, adminUserId)).rejects.toMatchObject({
      message: 'Organization not found',
      status: 404,
    });

    expect(OrganizationMember.findAll).not.toHaveBeenCalled();
  });

  it('should throw 400 if organization does not have Pending status', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockAdminUser);
    (Organization.findByPk as jest.Mock).mockResolvedValue({
      ...mockOrganization,
      status: 'Active',
    });

    await expect(approveOrganization(orgId, adminUserId)).rejects.toMatchObject({
      message: 'Only pending organizations can be approved',
      status: 400,
    });

    expect(mockOrganization.update).not.toHaveBeenCalled();
  });
});

// reject organization

describe('rejectOrganization', () => {
  const orgId = 'org-uuid';
  const adminUserId = 'admin-uuid';

  const reason = 'Reason for rejection description';

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrganization.status = 'Pending';
    mockOrganization.update.mockResolvedValue(mockOrganization);
  });

  it('should reject a pending organization and reject all pending memberships', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockAdminUser);
    (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
    (OrganizationMember.update as jest.Mock).mockResolvedValue([2]);

    const result = await rejectOrganization(orgId, adminUserId, reason);

    expect(mockOrganization.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Rejected', rejectionReason: reason })
    );

    expect(OrganizationMember.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Rejected', rejectionReason: reason }),
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: orgId, status: 'Pending' }),
      })
    );
    expect(result).toEqual(mockOrganization);
  });

  it('should still succeed when there are no pending memberships to reject', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockAdminUser);
    (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
    (OrganizationMember.update as jest.Mock).mockResolvedValue([0]);

    const result = await rejectOrganization(orgId, adminUserId, reason);

    expect(result).toEqual(mockOrganization);
    expect(OrganizationMember.update).toHaveBeenCalledTimes(1);
  });

  it('should throw 404 if admin user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(rejectOrganization(orgId, 'not-admin-uuid', reason)).rejects.toMatchObject({
      message: 'Admin user not found',
      status: 404,
    });

    expect(Organization.findByPk).not.toHaveBeenCalled();
  });

  it('should throw 403 if user does not have admin role', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
      id: 'other-user',
      role: 'user',
    });

    await expect(rejectOrganization(orgId, 'other-user', reason)).rejects.toMatchObject({
      message: 'You do not have permission to perform this action',
      status: 403,
    });

    expect(Organization.findByPk).not.toHaveBeenCalled();
    expect(mockOrganization.update).not.toHaveBeenCalled();
  });

  it('should throw 404 if organization does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockAdminUser);
    (Organization.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(rejectOrganization(orgId, adminUserId, reason)).rejects.toMatchObject({
      message: 'Organization not found',
      status: 404,
    });

    expect(OrganizationMember.findAll).not.toHaveBeenCalled();
  });

  it('should throw 400 if organization does not have Pending status', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockAdminUser);
    (Organization.findByPk as jest.Mock).mockResolvedValue({
      ...mockOrganization,
      status: 'Active',
    });

    await expect(rejectOrganization(orgId, adminUserId, reason)).rejects.toMatchObject({
      message: 'Only pending organizations can be rejected',
      status: 400,
    });

    expect(mockOrganization.update).not.toHaveBeenCalled();
  });
});

// get organization members

describe('getOrganizationMembers', () => {
  const orgId = 'org-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all members with user info when no filters provided', async () => {
    (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
    (OrganizationMember.findAll as jest.Mock).mockResolvedValue(mockMembers);

    const result = await getOrganizationMembers(orgId);

    expect(OrganizationMember.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: orgId }),
        include: expect.arrayContaining([expect.objectContaining({ model: User })]),
      })
    );
    expect(result).toHaveLength(3);
  });

  it('should filter all members by role', async () => {
    const editorMembers = mockMembers.filter((member) => member.role === 'editor');
    (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
    (OrganizationMember.findAll as jest.Mock).mockResolvedValue(editorMembers);

    const result = await getOrganizationMembers(orgId, { role: 'editor' });

    expect(OrganizationMember.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: orgId, role: 'editor' }),
      })
    );
    expect(result).toHaveLength(2);
    //expect(result).toHaveLength(3);
  });

  it('should filter all members by status', async () => {
    const pendingStatus = mockMembers.filter((member) => member.status === 'Pending');

    (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
    (OrganizationMember.findAll as jest.Mock).mockResolvedValue(pendingStatus);

    const result = await getOrganizationMembers(orgId, { status: 'Pending' });

    expect(OrganizationMember.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: orgId, status: 'Pending' }),
      })
    );

    expect(result).toHaveLength(1);
    expect((result[0] as any).status).toBe('Pending');
  });

  it('should filter all members by role and status at the same time', async () => {
    const activeEditors = mockMembers.filter(
      (member) => member.role === 'editor' && member.status === 'Active'
    );

    (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
    (OrganizationMember.findAll as jest.Mock).mockResolvedValue(activeEditors);

    const result = await getOrganizationMembers(orgId, { role: 'editor', status: 'Active' });

    expect(OrganizationMember.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: orgId, role: 'editor', status: 'Active' }),
      })
    );

    expect(result).toHaveLength(1);
  });

  it('should return an empty array when no filters match', async () => {
    (Organization.findByPk as jest.Mock).mockResolvedValue(mockOrganization);
    (OrganizationMember.findAll as jest.Mock).mockResolvedValue([]);

    const result = await getOrganizationMembers(orgId, { role: 'admin', status: 'Pending' });

    expect(result).toHaveLength(0);
  });

  it('should throw 404 if organization does not exist', async () => {
    (Organization.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(getOrganizationMembers(orgId)).rejects.toMatchObject({
      message: 'Organization not found',
      status: 404,
    });

    expect(OrganizationMember.findAll).not.toHaveBeenCalled();
  });
});
