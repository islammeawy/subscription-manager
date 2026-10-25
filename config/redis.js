import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err.message || err);
});

void redisClient.connect().catch((err) => {
  console.warn("Redis not available; continuing without cache:", err.message || err);
});

export const cache = {
  async get(key) {
    try {
      if (!redisClient.isOpen) return null;

      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn("Redis GET failed:", error.message || error);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
      return true;
    } catch (error) {
      console.warn("Redis SET failed:", error.message || error);
      return false;
    }
  },

  async del(...keys) {
    try {
      if (!redisClient.isOpen || !keys.length) return false;
      await redisClient.del(keys);
      return true;
    } catch (error) {
      console.warn("Redis DEL failed:", error.message || error);
      return false;
    }
  },
};

export default redisClient;
