import { Router } from 'express';
import * as authController from '../controllers/auth.controllers.js';

const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/register', authController.register);
authRouter.post('/logout', authController.logout);

export default authRouter;