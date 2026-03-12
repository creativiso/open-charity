import { Request, Response, Router } from 'express';
import { registerValidation, loginValidation } from '../validators/userValidators';
import { handleValidationErrors } from '../middleware/handleValidationErrors';
import { comparePassword, hashPassword } from '../middleware/auth';
import { User } from '../models';

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
        req.session.userId = user.id;
      });

      res.status(201).json({
        message: 'User logged in successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: true, message: 'Login failed' });
    }
  }
);

export default authController;
