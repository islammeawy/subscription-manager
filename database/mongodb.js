import mongoose from "mongoose";
import { DATABASE_URL, NODE_ENV } from "../config/env.js";

const connectDatabase = async () => {
  if (!DATABASE_URL) {
    console.warn("DATABASE_URL is not defined. Continuing without a database connection.");
    return false;
  }

  try {
    const normalizedDatabaseUrl = DATABASE_URL.replace(/<([^>]*)>/g, "$1").trim();
    await mongoose.connect(normalizedDatabaseUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log(`Connected to MongoDB in ${NODE_ENV} mode`);
    return true;
  } catch (error) {
    console.error("MongoDB connection failed. Continuing without a database connection:", error.message);
    return false;
  }
};

export default connectDatabase;
