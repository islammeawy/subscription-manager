import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  await mongoose.connect(mongoServer.getUri("subscription-tracker"));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Subscription.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
