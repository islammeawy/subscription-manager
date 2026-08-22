import express from "express";
import { PORT } from "./config/env.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import workflowRouter from "./routes/workflow.routes.js";
import connectDatabase from "./database/mongodb.js";
import "./models/subscription.model.js";
import "./models/user.model.js";
import errorMiddleware from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middleware/arcjet.middleware.js";

const app = express();
const port = Number(PORT) || 3000;

// Request body and cookie parsers
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(arcjetMiddleware);

// Routes (supporting both singular and plural endpoints)
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/workflow", workflowRouter);

app.get("/", (req, res) => {
  res.send("welcome to subscription tracker ");
});

// Error handling middleware (must be registered after all routes)
app.use(errorMiddleware);

const startServer = async () => {
  const isDatabaseConnected = await connectDatabase();

  if (!isDatabaseConnected) {
    console.warn(
      "Starting the server without a database connection. Database-backed routes will not work until MongoDB is reachable.",
    );
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

export default app;
