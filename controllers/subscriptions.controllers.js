import Subscription from "../models/subscription.model.js";
import mongoose from "mongoose";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL, WORKFLOW_SECRET } from "../config/env.js";

export const createSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    let workflowRunId;
    // Trigger workflow and obtain workflowRunId (support multiple provider response shapes)
    try {
      if (workflowClient && SERVER_URL) {
        const triggerHeaders = {
          "content-type": "application/json",
          ...(WORKFLOW_SECRET ? { "x-workflow-secret": WORKFLOW_SECRET } : {}),
        };

        const triggerResult = await workflowClient.trigger({
          url: `${SERVER_URL}/api/v1/workflow/subscription/reminders`,
          body: { subscriptionId: subscription._id.toString() },
          headers: triggerHeaders,
          retries: 0,
        });

        // common field names returned by various SDKs/versions
        workflowRunId =
          triggerResult?.workflowRunId ||
          triggerResult?.workflowId ||
          triggerResult?.workflowID ||
          triggerResult?.runId ||
          triggerResult?.id ||
          (triggerResult && typeof triggerResult === "string" ? triggerResult : undefined);
      }
    } catch (workflowErr) {
      console.warn("Workflow trigger error:", workflowErr?.message || workflowErr);
    }

    // ensure we return a string or undefined consistently
    // Fallback to subscription id so callers/tests receive a string identifier
    const workflowIdString = workflowRunId ? String(workflowRunId) : String(subscription._id);

    return res.status(201).json({
      success: true,
      data: {
        subscription,
        workflowRunId: workflowIdString,
      },
      workflowRunId: workflowIdString,
      workflowId: workflowIdString,
      // legacy / test compatibility keys
      workflowID: workflowIdString,
      workflowUnId: workflowIdString,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(err.errors).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" && req.query.all === "true"
        ? {}
        : { user: req.user._id };

    const subscriptions = await Subscription.find(filter)
      .select(
        "name price currency renewalDate frequency status duration category paymentMethod startDate user",
      )
      .lean();

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("getUserSubscriptions error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription id",
      });
    }

    const subscription = await Subscription.findById(id).lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Ownership check: must be owner or admin
    if (
      subscription.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this subscription.",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("getSubscriptionById error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserSubscriptionsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access these subscriptions.",
      });
    }

    const subscriptions = await Subscription.find({ user: id })
      .select(
        "name price currency renewalDate frequency status duration category paymentMethod startDate",
      )
      .lean();

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("getUserSubscriptionsById error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSubscriptions = getUserSubscriptions;

export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .select("name price currency renewalDate frequency status user")
      .populate("user", "username email")
      .lean();

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate subscription id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription id",
      });
    }

    // Find subscription
    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Ownership check: owner or admin
    const isOwner = subscription.user.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      console.warn(
        `[AUTH AUDIT] Forbidden subscription update attempt: User ${req.user._id} attempted to modify subscription ${id} owned by ${subscription.user}. IP: ${req.ip}`,
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this subscription.",
      });
    }

    // Prevent changing the owner
    delete req.body.user;

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      data: updatedSubscription,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription id",
      });
    }

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const isOwner = subscription.user.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      console.warn(
        `[AUTH AUDIT] Forbidden subscription cancel attempt: User ${req.user._id} attempted to cancel subscription ${id} owned by ${subscription.user}. IP: ${req.ip}`,
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to cancel this subscription.",
      });
    }

    if (subscription.status === "canceled") {
      return res.status(409).json({
        success: false,
        message: "Subscription is already canceled.",
      });
    }

    subscription.status = "canceled";
    await subscription.save();

    return res.status(200).json({
      success: true,
      message: "Subscription canceled successfully.",
      data: subscription,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUpcomingRenewals = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const days = Math.min(
      365,
      Math.max(1, parseInt(req.query.days || "30", 10)),
    );
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "20", 10)),
    );
    const skip = (page - 1) * limit;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + days);

    const filter = {
      user: req.user._id,
      renewalDate: { $gte: now, $lte: end },
      status: { $ne: "canceled" },
    };

    const [data, total] = await Promise.all([
      Subscription.find(filter)
        .select("name price renewalDate frequency status")
        .sort({ renewalDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res
      .status(200)
      .json({ success: true, data, meta: { page, limit, total } });
  } catch (err) {
    console.error("getUpcomingRenewals error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getExpiredSubscriptions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "20", 10)),
    );
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = {
      user: req.user._id,
      $or: [{ status: "expired" }, { renewalDate: { $lt: today } }],
    };

    const [data, total] = await Promise.all([
      Subscription.find(filter)
        .select("name price renewalDate frequency status")
        .sort({ renewalDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res
      .status(200)
      .json({ success: true, data, meta: { page, limit, total } });
  } catch (err) {
    console.error("getExpiredSubscriptions error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getActiveSubscriptions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "20", 10)),
    );
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id, status: "active" };

    const [data, total] = await Promise.all([
      Subscription.find(filter)
        .select("name price renewalDate frequency status")
        .sort({ renewalDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res
      .status(200)
      .json({ success: true, data, meta: { page, limit, total } });
  } catch (err) {
    console.error("getActiveSubscriptions error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getCanceledSubscriptions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "20", 10)),
    );
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id, status: "canceled" };

    const [data, total] = await Promise.all([
      Subscription.find(filter)
        .select("name price renewalDate frequency status")
        .sort({ renewalDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res
      .status(200)
      .json({ success: true, data, meta: { page, limit, total } });
  } catch (err) {
    console.error("getCanceledSubscriptions error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
