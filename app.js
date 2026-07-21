import express from 'express';
import { PORT } from './config/env.js';
import subscriptionRouter from './routes/subscription.routes.js';
import userRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import connectDatabase from './database/mongodb.js';
import './models/subscribtion.model.js';
import './models/user.model.js';
import errorMiddleware from './middleware/error.middleware.js';
import cookieParser from 'cookie-parser';

const app = express();
const port = Number(PORT) || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(errorMiddleware);

app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);

app.get('/', (req, res) => {
  res.send('welcome to subscription tracker ');
});

const startServer = async () => {
  const isDatabaseConnected = await connectDatabase();

  if (!isDatabaseConnected) {
    console.warn('Starting the server without a database connection. Database-backed routes will not work until MongoDB is reachable.');
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

export default app;