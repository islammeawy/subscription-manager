import mongoose from "mongoose";
import User from "../models/user.model.js";

/**
 * Fetch all users (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").lean();
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch user by ID (Owner or Admin only)
 */
const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isOwner = req.user && req.user._id.toString() === userId;
    const isAdmin = req.user && req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      console.warn(
        `[AUTH AUDIT] Forbidden profile access attempt: User ${req.user?._id} attempted to view profile of user ${userId}. IP: ${req.ip}`,
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this user profile.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must be either 'user' or 'admin'.",
      });
    }

    // Guard against removing the last administrator
    if (req.user._id.toString() === userId && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the sole remaining administrator.",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true },
    )
      .select("-password")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      `[ADMIN AUDIT] User ${req.user._id} updated role of user ${userId} to '${role}'`,
    );

    return res.status(200).json({
      success: true,
      message: `User role updated successfully to '${role}'.`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export { getAllUsers, getUserById, updateUserRole };
