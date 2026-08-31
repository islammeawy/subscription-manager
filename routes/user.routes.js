import { Router } from "express";
import {
  getUserById,
  getAllUsers,
  updateUserRole,
} from "../controllers/user.controllers.js";
import { authorizeAdmin, authorize } from "../middleware/auth.middleware.js";
import { getUserSubscriptionsById } from "../controllers/subscriptions.controllers.js";

const userRouter = Router();

userRouter.get("/", authorize, authorizeAdmin, getAllUsers);
userRouter.get("/:id/subscriptions", authorize, getUserSubscriptionsById);
userRouter.get("/:id", authorize, getUserById);
userRouter.patch("/:id/role", authorize, authorizeAdmin, updateUserRole);

export default userRouter;
