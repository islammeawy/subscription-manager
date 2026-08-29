import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import mongoose from "mongoose";

export const register = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "username, email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      const duplicateField =
        existingUser.email.toLowerCase() === normalizedEmail
          ? "email"
          : "username";
      return res.status(409).json({
        success: false,
        error: `User with given ${duplicateField} already exists`,
      });
    }

    const [user] = await User.create(
      [
        {
          username: normalizedUsername,
          email: normalizedEmail,
          password,
        },
      ],
      { session },
    );

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user, token },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Allow login by email or username
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: String(email).trim() }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  } catch (err) {
    if (next) return next(err);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};

export const logout = async (req, res, next) => {
  try {
    // Clear authentication cookie if present. Clients that store tokens should remove them client-side.
    res.clearCookie("token");

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};
