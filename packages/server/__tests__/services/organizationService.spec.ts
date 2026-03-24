import { Organization, OrganizationMember, sequelize } from '../../src/models';

import {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganizations,
  requestMembership,
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
    create: jest.fn(),
    findOne: jest.fn(),
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

// ─── requestMembership ──────────────────────────────────────────

describe('requestMembership', () => {
  const userId = 'user-uuid';
  const organizationId = 'org-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a pending editor membership', async () => {
    (Organization.findByPk as jest.Mock).mockResolvedValue({
      ...mockOrganization,
      status: 'Active',
    });
    (OrganizationMember.findOne as jest.Mock).mockResolvedValue(null);
    (OrganizationMember.create as jest.Mock).mockResolvedValue({
      userId,
      organizationId,
      role: 'editor',
      status: 'Pending',
    });

    const result = await requestMembership(userId, organizationId);

    expect(OrganizationMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        organizationId,
        role: 'editor',
        status: 'Pending',
        joinedAt: expect.any(Date),
      })
    );
    expect(result).toMatchObject({ role: 'editor', status: 'Pending' });
  });

  it('should throw 404 if organization not found', async () => {
    (Organization.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(requestMembership(userId, organizationId)).rejects.toMatchObject({
      message: 'Organization not found',
      status: 404,
    });

    expect(OrganizationMember.create).not.toHaveBeenCalled();
  });

  it('should throw 400 if organization is not active', async () => {
    (Organization.findByPk as jest.Mock).mockResolvedValue({
      ...mockOrganization,
      status: 'Pending',
    });

    await expect(requestMembership(userId, organizationId)).rejects.toMatchObject({
      message: 'Organization is not active',
      status: 400,
    });

    expect(OrganizationMember.create).not.toHaveBeenCalled();
  });

  it('should throw 409 if user is already a member', async () => {
    (Organization.findByPk as jest.Mock).mockResolvedValue({
      ...mockOrganization,
      status: 'Active',
    });
    (OrganizationMember.findOne as jest.Mock).mockResolvedValue({
      userId,
      organizationId,
      status: 'Active',
    });

    await expect(requestMembership(userId, organizationId)).rejects.toMatchObject({
      message: 'User is already a member of this organization or has a pending request',
      status: 409,
    });

    expect(OrganizationMember.create).not.toHaveBeenCalled();
  });
});
