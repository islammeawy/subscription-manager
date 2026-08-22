import { createRequire } from "module";
import Subscription from "../models/subscription.model.js";
import dayjs from "dayjs";

const require = createRequire(import.meta.url);

const reminders = [7, 5, 2, 1]; // Days before expiration to send reminders

const { serve } = require("@upstash/workflow/express");

export const sendReminderWorkflow = serve(async (context) => {
  // Extract the request body
  const { subscriptionId } = context.requestPayload;
  const subscription = await fetchSubscriptionById(context, subscriptionId);

  if (!subscription || subscription.status !== "active") {
    return;
  }

  const renewalDate = dayjs(subscription.renewalDate);

  if (renewalDate.isBefore(dayjs())) {
    console.log("Subscription has expired, updating status to 'expired'");

    subscription.status = "expired";
    await subscription.save();
    return;
  }

  for (const daysBefore of reminders) {
    const reminderDate = renewalDate.subtract(daysBefore, "day");

    if (reminderDate.isAfter(dayjs())) {
      await sleepUntilReminderDate(context, `${daysBefore}-day`, reminderDate);
    }

    await triggerReminder(context, `${daysBefore}-day`);
  }
});

const fetchSubscriptionById = async (context, subscriptionId) => {
  return await context.run("fetchSubscription", () => {
    return Subscription.findById(subscriptionId).populate(
      "user",
      "userId email",
    );
  });
};

const sleepUntilReminderDate = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder date: ${date.toISOString()}`);
  await context.sleepUntil(date.toDate());
};

const triggerReminder = async (context, label) => {
  console.log(
    `Triggering ${label} reminder for subscription ${context.requestPayload.subscriptionId}`,
  );

  // send email , sms , notification , etc. based on your requirements
};
