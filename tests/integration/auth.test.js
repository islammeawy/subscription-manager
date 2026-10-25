import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";

const registerUser = async ({
  username = "alice",
  email = "alice@example.com",
  password = "Password123!",
  role = "user",
} = {}) =>
  request(app).post("/api/v1/auth/register").send({ username, email, password, role });

const loginUser = async ({
  email = "alice@example.com",
  password = "Password123!",
} = {}) => request(app).post("/api/v1/auth/login").send({ email, password });

const buildToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || "change_this_secret", {
    expiresIn: "1d",
  });

describe("Authentication API", () => {
  it("registers a user successfully", async () => {
    const response = await registerUser({ username: "alice", email: "alice@example.com" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("alice@example.com");
    expect(response.body.data.token).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    await registerUser({ username: "alice", email: "alice@example.com" });

    const response = await registerUser({ username: "alice2", email: "alice@example.com" });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain("email");
  });

  it("rejects an invalid email format", async () => {
    const response = await registerUser({ username: "bad-email", email: "not-an-email" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/valid email/i);
  });

  it("logs in successfully", async () => {
    await registerUser({ username: "alice", email: "alice@example.com" });

    const response = await loginUser({ email: "alice@example.com", password: "Password123!" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTruthy();
  });

  it("rejects a wrong password", async () => {
    await registerUser({ username: "alice", email: "alice@example.com" });

    const response = await loginUser({ email: "alice@example.com", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/invalid credentials/i);
  });

  it("rejects a missing token", async () => {
    const response = await request(app).get("/api/v1/subscriptions");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Unauthorized");
  });

  it("rejects an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/subscriptions")
      .set("Authorization", "Bearer not-a-valid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Unauthorized");
  });

  it("accepts a valid JWT for authenticated routes", async () => {
    const user = await request(app).post("/api/v1/auth/register").send({
      username: "token-user",
      email: "token-user@example.com",
      password: "Password123!",
    });
    const token = buildToken(user.body.data.user);

    const response = await request(app)
      .get("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
