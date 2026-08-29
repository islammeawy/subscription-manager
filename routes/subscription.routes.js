import { Router } from "express";
import { authorize, authorizeAdmin } from "../middleware/auth.middleware.js";
import {
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  getUserSubscriptionsById,
  getAllSubscriptions,
  updateSubscription,
  cancelSubscription,
  getUpcomingRenewals,
  getExpiredSubscriptions,
  getActiveSubscriptions,
  getCanceledSubscriptions,
} from "../controllers/subscriptions.controllers.js";

const subscriptionRouter = Router();

// Admin route to get all subscriptions across all users
subscriptionRouter.get("/admin/all", authorize, authorizeAdmin, getAllSubscriptions);

// user-specific filtered views (static routes must come before the param route)
subscriptionRouter.get("/upcoming-renewals", authorize, getUpcomingRenewals);
subscriptionRouter.get("/expired", authorize, getExpiredSubscriptions);
subscriptionRouter.get("/active", authorize, getActiveSubscriptions);
subscriptionRouter.get("/canceled", authorize, getCanceledSubscriptions);

// Subscriptions by user ID
subscriptionRouter.get("/user/:id", authorize, getUserSubscriptionsById);

// General subscription list (returns current logged-in user's subscriptions)
subscriptionRouter.get("/", authorize, getUserSubscriptions);

// Single subscription by subscription ID
subscriptionRouter.get("/:id", authorize, getSubscriptionById);

// Create, update, cancel
subscriptionRouter.post("/", authorize, createSubscription);
subscriptionRouter.put("/:id", authorize, updateSubscription);
subscriptionRouter.patch("/:id/cancel", authorize, cancelSubscription);

export default subscriptionRouter;
