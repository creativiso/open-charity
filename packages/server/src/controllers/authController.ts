import { Request, Response, Router } from 'express';
import { registerValidation, loginValidation } from '../validators/userValidators';
import { handleValidationErrors } from '../middleware/handleValidationErrors';
import { hashPassword, requireAuth } from '../middleware/auth';
import { Organization, OrganizationMember, User } from '../models';

const authController: Router = Router();

authController.get('/register', (req: Request, res: Response) => {
  res.render('auth/register', {
    title: 'Създайте акаунт',
    errors: [],
    fieldErrors: {},
    formData: {},
  });
});

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

      res.redirect('/auth/login?registered=true');
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: true, message: 'Registration failed' });
    }
  }
);

authController.get('/login', (req: Request, res: Response) => {
  res.render('auth/login', {
    title: 'Влезте в акунта си',
    error: null,
    errors: [],
    fieldErrors: {},
    formData: {},
    successMsg: req.query.registered ? 'Акаунтът е създаден успешно! Моля влезте.' : null,
  });
});

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
          if (saveErr)
            return res.status(500).render('auth/login', {
              title: 'Влезте в акунта си',
              error: 'Login failed. Please try again.',
              errors: [],
              fieldErrors: {},
              formData: { email },
            });

          res.redirect('/');
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
    res.redirect('/');
    //res.status(200).json({ message: 'Logout successfully' });
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
