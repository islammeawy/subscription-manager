import { Router } from "express";
import { sendReminderWorkflow } from "../controllers/workflow.controllers.js";
import { verifyWorkflowRequest } from "../middleware/workflow.middleware.js";

const workflowRouter = Router();

workflowRouter.post(
  "/subscription/reminders",
  verifyWorkflowRequest,
  sendReminderWorkflow,
);

export default workflowRouter;
