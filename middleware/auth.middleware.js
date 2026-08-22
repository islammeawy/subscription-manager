import { JWT_SECRET } from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authorize = async (req, res, next) => {
  try {
    let token;
    // Accept Authorization header (case-insensitive) or cookie fallback
    if (req.headers.authorization) {
      const auth = req.headers.authorization;
      if (auth.toLowerCase().startsWith('bearer ')) {
        token = auth.split(' ')[1];
      }
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyErr) {
      console.error('JWT verify error:', verifyErr.message);
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    next(err);
  }
};

export const authorizeAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    next();
  } catch (err) {
    res.status(403).json({ success: false, error: "Forbidden" });
    next(err);
  }
};
