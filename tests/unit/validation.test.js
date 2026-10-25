import { describe, expect, it } from "vitest";
import { isValidEmail } from "../../utils/validation.js";

describe("Email validation", () => {
  it("accepts a valid email address", () => {
    expect(isValidEmail("alice@example.com")).toBe(true);
  });

  it("rejects an invalid email address", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
  });
});
