import aj from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
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
