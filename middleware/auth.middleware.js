import { JWT_SECRET } from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Authentication middleware to verify JWT token from Authorization header or cookie.
 */
export const authorize = async (req, res, next) => {
  const clientIp = req.ip || req.connection?.remoteAddress || "unknown";

  try {
    let token;
    // Accept Authorization header (case-insensitive Bearer or raw token) or cookie fallback
    if (req.headers.authorization) {
      const auth = req.headers.authorization.trim();
      if (auth.toLowerCase().startsWith("bearer ")) {
        token = auth.substring(7).trim();
      } else if (!auth.includes(" ")) {
        token = auth;
      }
    }

    if (!token && req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.warn(
        `[AUTH AUDIT] Missing token: Unauthorized request to ${req.method} ${req.originalUrl} (IP: ${clientIp})`,
      );
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyErr) {
      console.warn(
        `[AUTH AUDIT] Invalid token (${verifyErr.message}): Unauthorized request to ${req.method} ${req.originalUrl} (IP: ${clientIp})`,
      );
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userId = decoded.id || decoded._id || decoded.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      console.warn(
        `[AUTH AUDIT] User not found: Valid token for non-existent user (${userId}) on ${req.method} ${req.originalUrl} (IP: ${clientIp})`,
      );
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(
      `[AUTH ERROR] Authentication middleware exception on ${req.method} ${req.originalUrl}:`,
      err.message,
    );
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

/**
 * Authorization middleware to verify the authenticated user has 'admin' role.
 */
export const authorizeAdmin = async (req, res, next) => {
  const clientIp = req.ip || req.connection?.remoteAddress || "unknown";

  try {
    if (!req.user || req.user.role !== "admin") {
      console.warn(
        `[AUTH AUDIT] Forbidden admin access: User ${req.user?._id || "unauthenticated"} (role: '${req.user?.role || "none"}') attempted admin action on ${req.method} ${req.originalUrl} (IP: ${clientIp})`,
      );
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    next();
  } catch (err) {
    console.error(
      `[AUTH ERROR] Admin authorization exception on ${req.method} ${req.originalUrl}:`,
      err.message,
    );
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
};
