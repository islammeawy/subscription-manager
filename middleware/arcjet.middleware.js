import aj from "../config/arcjet.js";
import { NODE_ENV } from "../config/env.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    // In development allow localhost requests to bypass Arcjet for local testing
    if (NODE_ENV !== "production") {
      const ip =
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "";
      const host = req.hostname || req.headers.host || "";
      if (
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip.includes("127.0.0.1") ||
        ip.includes("::ffff:127.0.0.1") ||
        host.includes("localhost") ||
        host.includes("127.0.0.1")
      ) {
        return next();
      }
    }
    const decision = await aj.protect(req, { requested: 1 });

    if (
      decision.isDenied && typeof decision.isDenied === "function"
        ? decision.isDenied()
        : false
    ) {
      if (
        decision.reason &&
        typeof decision.reason.isRateLimit === "function" &&
        decision.reason.isRateLimit()
      ) {
        return res.status(429).json({ message: "Too many requests" });
      }

      if (
        decision.reason &&
        typeof decision.reason.isBot === "function" &&
        decision.reason.isBot()
      ) {
        return res.status(403).json({ message: "Bot detected" });
      }

      return res.status(403).json({ message: "Access denied" });
    }

    // If allowed, continue to next handler
    return next();
  } catch (error) {
    console.error("Arcjet middleware error:", error);
    next(error);
  }
};

export default arcjetMiddleware;
