import { Organization, OrganizationMember, sequelize, User } from '../../src/models';

import {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganizations,
  getOrganizationMembers,
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

// get organization members

describe('getOrganizationMembers', () => {
  const orgId = 'org-uuid';

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
