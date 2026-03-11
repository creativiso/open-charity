import { Organization, OrganizationMember, User } from '../../models';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userOrganizations?: OrganizationMember[];
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
