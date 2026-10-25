import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/user.model.js";

const buildToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || "change_this_secret", {
    expiresIn: "1d",
  });

describe("User API", () => {
  it("allows a user to fetch their own profile", async () => {
    const user = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });
    const token = buildToken(user);

    const response = await request(app)
      .get(`/api/v1/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("alice@example.com");
  });

  it("prevents a user from viewing another user's profile", async () => {
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

    const response = await request(app)
      .get(`/api/v1/users/${bob._id}`)
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/permission/i);
  });
});
