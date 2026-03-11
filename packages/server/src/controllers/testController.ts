import { NextFunction, Request, Response } from 'express';
import { comparePassword, hashPassword, validatePasswordStrength } from '../middleware/auth';
import { User } from '../models';
import { generateToken } from '../middleware/jwtAuth';

export const testHash = async (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  const isStrongPassword = validatePasswordStrength(password);

  //console.log(isStrongPassword);

  if (!isStrongPassword) {
    //console.log(isStrongPassword);
    res.json({ step: 'validatePasswordStrength', result: 'FAIL', error: 'Invalid password' });
    return;
  }

  const hash = await hashPassword(password);

  const matchTrue = await comparePassword(password, hash);

  const matchFalse = await comparePassword('wrongpassword', hash);

  res.status(200).json({
    step: 'all password tests',
    strengthValid: isStrongPassword,
    hash,
    matchCorrectPassword: matchTrue,
    matchWrongPassword: matchFalse,
  });
};

export const testRequireAuth = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ message: 'You are authenticated', user: req.user });
};

export const testRequireAdmin = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ message: 'You are an admin', user: req.user });
};

export const testGenerateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    // console.log(userId);
    const user = await User.findByPk(userId as string);
    // console.log(user);

    if (!user) {
      res.status(404).json({ error: true, message: 'User not found' });
      return;
    }

    const token = generateToken(user);
    res.status(200).json({ test: 'generateToken', token });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message });
  }
};

export const testVerifyToken = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ test: 'verifyToken', result: 'PASS', user: req.user });
};

export const testRequireAdminJWt = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ test: 'requireAdminJWT', result: 'PASS', user: req.user });
};

export const testLoadUserOrganizations = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    test: 'loadUserOrganizations',
    result: 'PASS',
    organizations: req.userOrganizations,
  });
};

export const testRequireOrgEditor = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    test: 'requireOrgEditor',
    result: 'PASS',
  });
};

export const testRequireOrgAdmin = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    test: 'requireOrgAdmin',
    result: 'PASS',
  });
};

// export const createUser =  async (req: Request, res: Response, next: NextFunction) => {
//   const hash = await hashPassword('TestUser123');
//   console.log(hash);
//   const user = await User.create({
//     name: 'Test User',
//     email: 'test@test.com',
//     passwordHash: hash,
//     role: 'user',
//   });
//   res.status(201).json({ message: 'User created', user });
// };

// export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const organization = await Organization.create({
//       name: 'Test Organization',
//       slug: 'test-organization',
//       description: 'Test organization description',
//       contactEmail: 'org@test.com',
//       websiteUrl: 'https://test.com',
//       locationRegion: 'Test Region',
//       locationCity: 'Test City',
//       isVerified: false,
//       status: 'Active',
//     });

//     res.status(201).json({ message: 'Organization created', organization });
//   } catch (error: any) {
//     res.status(500).json({ error: true, message: error.message });
//   }
// }

// export const createMember = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { userId, organizationId, role } = req.query;
//     console.log(userId);
//     console.log(organizationId);
//     console.log(role);

//     if (!userId || !organizationId) {
//       res.status(400).json({ error: true, message: 'userId and organizationId are required' });
//       return;
//     }

//     const member = await OrganizationMember.create({
//       userId: userId as string,
//       organizationId: organizationId as string,
//       role: (role as string) || 'editor',
//       status: 'Active',
//       joinedAt: new Date(),
//     });

//     res.status(201).json({ message: 'Member created', member });
//   } catch (error: any) {
//     res.status(500).json({ error: true, message: error.message });
//   }
// }
