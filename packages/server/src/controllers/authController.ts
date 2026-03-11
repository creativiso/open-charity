import { Request, Response, Router } from 'express';

const authController: Router = Router();

authController.post('/register', (req: Request, res: Response) => {});

export default authController;
