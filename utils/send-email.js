import {emailTemplates} from "./email-template.js";
import dayjs from "dayjs";
import {transporter, accountEmail} from "../config/nodemailer.js";
import { SERVER_URL } from "../config/env.js";

export const sendEmailReminder = async (to, type, subscription) => {
  if (!to || !type || !subscription) {
    throw new Error("Missing required parameters for sending email reminder.");
  }

  const template = emailTemplates.find((t) => t.label === type);
  if (!template) {
    throw new Error(`Email template for type "${type}" not found.`);
  }

  const mailInfo = {
    userName: subscription.user?.username || subscription.user?.name || "",
    subscriptionName: subscription.name,
    renewalDate: dayjs(subscription.renewalDate).format("MMMM D, YYYY"),
    paymentMethod: subscription.paymentMethod,
    planName: subscription.name,
    price: `${subscription.currency} ${subscription.price} ${subscription.frequency}`,
    accountSettingsLink: `${SERVER_URL}/account`,
    supportLink: `${SERVER_URL}/support`,
  };

  const subject = template.generateSubject(mailInfo);
  const body = template.generateBody(mailInfo);

  const mailOptions = {
    from: `SubDub <${accountEmail}>`,
    to,
    subject,
    html: body,
    text: body.replace(/<[^>]+>/g, ""),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} for subscription "${subscription.name}"`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    // rethrow so callers can handle/fail workflows if desired
    throw error;
  }
};