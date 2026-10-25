import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/user.model.js";
import Subscription from "../../models/subscription.model.js";

const buildToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || "change_this_secret", {
    expiresIn: "1d",
  });

const makeSubscription = (payload = {}) => ({
  name: "Netflix",
  price: 15.99,
  currency: "USD",
  duration: 1,
  frequency: "monthly",
  category: "entertainment",
  paymentMethod: "credit_card",
  startDate: new Date(Date.now() + 86400000).toISOString(),
  renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  ...payload,
});

describe("Subscription API", () => {
  it("creates a subscription for the authenticated user", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const token = buildToken(user);

    const response = await request(app)
      .post("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${token}`)
      .send(makeSubscription());

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.subscription.user.toString()).toBe(user._id.toString());
  });

  it("retrieves the current user's subscriptions", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const token = buildToken(user);
    await Subscription.create({ ...makeSubscription(), user: user._id });

    const response = await request(app)
      .get("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  it("retrieves one subscription by id", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const token = buildToken(user);
    const subscription = await Subscription.create({ ...makeSubscription(), user: user._id });

    const response = await request(app)
      .get(`/api/v1/subscriptions/${subscription._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id.toString()).toBe(subscription._id.toString());
  });

  it("updates a subscription", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const token = buildToken(user);
    const subscription = await Subscription.create({ ...makeSubscription(), user: user._id });

    const response = await request(app)
      .put(`/api/v1/subscriptions/${subscription._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 25.5, status: "active" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.price).toBe(25.5);
  });

  it("cancels a subscription", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const token = buildToken(user);
    const subscription = await Subscription.create({
      ...makeSubscription(),
      user: user._id,
      status: "active",
    });

    const response = await request(app)
      .patch(`/api/v1/subscriptions/${subscription._id}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("canceled");
  });

  it("rejects invalid subscription payloads", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const token = buildToken(user);

    const response = await request(app)
      .post("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "A",
        price: -5,
        currency: "USD",
        duration: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("prevents a user from accessing another user's subscription", async () => {
    const alice = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const bob = await User.create({
      username: "bob",
      email: "bob@example.com",
      password: "Password123!",
    });
    const aliceToken = buildToken(alice);
    const bobSubscription = await Subscription.create({
      ...makeSubscription({ name: "Spotify" }),
      user: bob._id,
    });

    const response = await request(app)
      .get(`/api/v1/subscriptions/${bobSubscription._id}`)
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/permission/i);
  });
});
