import { createRequire } from "module";
import Subscription from "../models/subscription.model.js";
import dayjs from "dayjs";

const require = createRequire(import.meta.url);

const reminders = [7, 5, 2, 1]; // Days before expiration to send reminders

const { serve } = require("@upstash/workflow/express");

export const sendReminderWorkflow = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;
  const subscription = await fetchSubscriptionById(context, subscriptionId);

  if (!subscription || subscription.status !== "active") {
    return;
  }

  const renewalDate = dayjs(subscription.renewalDate);

  if (renewalDate.isBefore(dayjs())) {
    console.log(`Subscription ${subscriptionId} has expired, updating status to 'expired'`);
    await context.run("expire subscription", async () => {
      await Subscription.findByIdAndUpdate(subscriptionId, { status: "expired" });
    });
    return;
  }

  for (const daysBefore of reminders) {
    const reminderDate = renewalDate.subtract(daysBefore, "day");

    if (reminderDate.isAfter(dayjs())) {
      await sleepUntilReminderDate(context, `Reminder ${daysBefore} days before`, reminderDate);
    }

    if (dayjs().isSame(reminderDate, "day")) {
      await triggerReminder(context, `${daysBefore} days before reminder`, subscription);
    }
  }
});

const fetchSubscriptionById = async (context, subscriptionId) => {
  return await context.run("get subscription", async () => {
    return await Subscription.findById(subscriptionId)
      .populate("user", "username email")
      .lean();
  });
};

const sleepUntilReminderDate = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder date: ${date.toISOString()}`);
  await context.sleepUntil(label, date.toDate());
};

const triggerReminder = async (context, label, subscription) => {
  return await context.run(label, async () => {
    console.log(
      `Triggering ${label} for subscription ${subscription._id || context.requestPayload.subscriptionId}`,
    );
    // Send email / SMS / notification here
  });
};

