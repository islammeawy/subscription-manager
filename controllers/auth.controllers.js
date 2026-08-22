import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import mongoose from "mongoose";

export const register = async (req, res, next) => {
  const session = await mongoose.startSession();
  await session.startTransaction();

  try {
    // create a new user
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "username, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with given email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create([{ username, email, password: hashed }], {
      session,
    });

    const token = jwt.sign({ id: user[0]._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: { user: user[0], token } });
  } catch (err) {
    session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "email and password are required" });
    }
    const user =
      (await User.findOne({ email }).select("+password")) ||
      (await User.findOne({ email }));

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
    next(err);
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
