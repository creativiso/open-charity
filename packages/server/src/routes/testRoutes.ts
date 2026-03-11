import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { requireAdminJWT, verifyToken } from '../middleware/jwtAuth';
import { loadUserOrganizations, requireOrgAdmin, requireOrgEditor } from '../middleware/orgContext';
import {
  testGenerateToken,
  testHash,
  testLoadUserOrganizations,
  testRequireAdmin,
  testRequireAdminJWt,
  testRequireAuth,
  testRequireOrgAdmin,
  testRequireOrgEditor,
  testVerifyToken,
} from '../controllers/testController';

const testRouter = Router();

testRouter.post('/test/hash', testHash);
testRouter.get('/test/protected', requireAuth, testRequireAuth);
testRouter.get('/test/admin', requireAuth, requireAdmin, testRequireAdmin);
testRouter.get('/jwt/generate/:userId', testGenerateToken);
testRouter.get('/jwt/verify', verifyToken, testVerifyToken);
testRouter.get('/jwt/admin', verifyToken, requireAdminJWT, testRequireAdminJWt);
testRouter.get(
  '/organization/my-organizations',
  verifyToken,
  loadUserOrganizations,
  testLoadUserOrganizations
);
testRouter.get(
  '/organization/:organizationId/editor',
  verifyToken,
  requireOrgEditor,
  testRequireOrgEditor
);
testRouter.get(
  '/organization/:organizationId/admin',
  verifyToken,
  requireOrgAdmin,
  testRequireOrgAdmin
);

// testRouter.get('/seed/user', createUser);
// testRouter.get('/seed/organization', createOrganization);
// testRouter.get('/seed/member', createMember);

export default testRouter;
