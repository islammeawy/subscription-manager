import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import User from "../../models/user.model.js";

describe("User model behavior", () => {
  it("hashes the password before saving", async () => {
    const user = new User({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
    });

    await user.save();

    expect(user.password).not.toBe("Password123!");
    expect(await bcrypt.compare("Password123!", user.password)).toBe(true);
  });

  it("defaults to the user role", async () => {
    const user = new User({
      username: "bob",
      email: "bob@example.com",
      password: "Password123!",
    });

    await user.save();

    expect(user.role).toBe("user");
  });
});
