import { JWT_SECRET, NODE_ENV } from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authorize = async (req, res, next) => {
  try {
    let token;
    // Accept Authorization header (case-insensitive) or cookie fallback
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

    if (NODE_ENV !== "production") {
      console.debug(
        "auth debug - header.authorization:",
        req.headers.authorization,
      );
      console.debug(
        "auth debug - cookie.token:",
        req.cookies && req.cookies.token,
      );
    }

    if (!token) {
      if (NODE_ENV !== "production")
        console.debug("auth debug - no token found");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (NODE_ENV !== "production")
        console.debug("auth debug - decoded token:", decoded);
    } catch (verifyErr) {
      console.error("JWT verify error:", verifyErr.message);
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userId = decoded.id || decoded._id || decoded.userId;
    const user = await User.findById(userId).select("-password");
    if (NODE_ENV !== "production")
      console.debug("auth debug - user lookup:", !!user);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    req.user = user;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

export const authorizeAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
};
