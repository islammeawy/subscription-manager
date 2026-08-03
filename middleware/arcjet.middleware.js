import aj from "../config/arcjet.js";

const arcjetMiddleware = (req, res, next) => {
  try {
    const decision = aj.process(req);

    if (decision.isDenied) {
      if (decision.reason.isRateLimit()) return res.status(429).json({ message: "Too many requests" });

      if (decision.reason.isBot()) return res.status(403).json({ message: "Bot detected" });

      return res.status(403).json({ message: "Access denied" });
    }

  }catch (error) {
    console.error("Arcjet middleware error:", error);
    next(error);
  }
}

export default arcjetMiddleware;