import {Router} from 'express';
import {getUserById, getAllUsers} from '../controllers/user.controllers.js';
import authorize from '../middleware/auth.middleware.js';

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', authorize, getUserById);

export default userRouter;