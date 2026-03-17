import { Request, Response, Router } from 'express';
import { registerValidation, loginValidation } from '../validators/userValidators';
import { handleValidationErrors } from '../middleware/handleValidationErrors';
import { hashPassword, requireAuth } from '../middleware/auth';
import { Organization, OrganizationMember, User } from '../models';
import { error } from 'console';

const authController: Router = Router();

authController.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
      const passwordHash = await hashPassword(password);

      const user = await User.create({
        name,
        email,
        passwordHash,
        role: 'user',
      });

      req.session.userId = user.id;

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: true, message: 'Registration failed' });
    }
  }
);

authController.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({
        where: {
          email,
        },
      });

      if (!user || !(await user.validatePassword(password))) {
        res.status(401).json({ error: true, message: 'Invalid email or password' });
        return;
      }

      req.session.regenerate((err) => {
        if (err) {
          res.status(500).json({ error: true, message: 'Login failed' });
          return;
        }

        req.session.userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            res.status(500).json({ error: true, message: 'Login failed' });
            return;
          }

          res.status(200).json({
            message: 'User logged in successfully',
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
        });
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: true, message: 'Login failed' });
    }
  }
);

authController.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: true, message: 'Logout failed' });
      return;
    }

    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout successful' });
  });
});

authController.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.user?.id, {
      include: [
        {
          model: OrganizationMember,
          required: false,
          include: [
            {
              model: Organization,
              attributes: ['id', 'name', 'slug', 'status', 'isVerified'],
            },
          ],
          attributes: ['role', 'status', 'joinedAt'],
          where: {
            status: 'Active',
          },
        },
      ],
    });

    res.status(200).json({ user });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: true, message: 'Could not get current user' });
  }
});

export default authController;
