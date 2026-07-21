import {Router} from 'express';

const userRouter = Router();
  
userRouter.get('/', (req, res) => {
  res.send('user profile route');
});

userRouter.put('/', (req, res) => {
  res.send('update user profile route');
}); 

export default userRouter;