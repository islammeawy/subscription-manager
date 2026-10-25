import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import Subscription from "../../models/subscription.model.js";

describe("Subscription model logic", () => {
  it("sets a renewal date automatically when one is missing", async () => {
    const subscription = new Subscription({
      user: new mongoose.Types.ObjectId(),
      name: "Netflix",
      price: 15.99,
      currency: "USD",
      duration: 1,
      frequency: "monthly",
      category: "entertainment",
      paymentMethod: "credit_card",
      startDate: new Date(),
    });

    await subscription.save();

    expect(subscription.renewalDate).toBeTruthy();
    expect(subscription.status).toBe("active");
  });

  it("keeps a subscription active when its renewal date is still in the future", async () => {
    const startDate = new Date();
    const futureRenewal = new Date();
    futureRenewal.setDate(futureRenewal.getDate() + 30);

    const subscription = new Subscription({
      user: new mongoose.Types.ObjectId(),
      name: "Spotify",
      price: 9.99,
      currency: "USD",
      duration: 1,
      frequency: "monthly",
      category: "music",
      paymentMethod: "credit_card",
      startDate,
      renewalDate: futureRenewal,
      status: "active",
    });

    await subscription.save();

    expect(subscription.status).toBe("active");
    expect(subscription.renewalDate.getTime()).toBeGreaterThan(subscription.startDate.getTime());
  });
});
