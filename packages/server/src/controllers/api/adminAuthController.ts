import { Request, Response, Router } from 'express';
import { loginValidation } from '../../validators/userValidators';
import { handleValidationErrors } from '../../middleware/handleValidationErrors';
import { User } from '../../models';
import { generateToken, requireAdminJWT, verifyToken } from '../../middleware/jwtAuth';

const adminAuthController: Router = Router();

adminAuthController.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user || !(await user.validatePassword(password))) {
        res.status(401).json({ error: true, message: 'Invalid credentials' });
        return;
      }

      const token = generateToken(user);

      res.status(200).json({
        message: 'Admin login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Admin login error:' + err);
      res.status(500).json({ error: true, message: 'Login failed' });
    }
  }
);

adminAuthController.post(
  '/refresh',
  verifyToken,
  requireAdminJWT,
  (req: Request, res: Response) => {
    const user = req.user!;

    try {
      const refreshToken = generateToken(user);

      res.status(200).json({
        message: 'Token refreshed successfully',
        token: refreshToken,
      });
    } catch (err) {
      console.error('Token refresh error:' + err);
      res.status(500).json({ error: true, message: 'Token refresh failed' });
    }
  }
);

export default adminAuthController;
