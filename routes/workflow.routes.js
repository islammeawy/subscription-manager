import { Router } from "express";
import { sendReminderWorkflow } from "../controllers/workflow.controllers.js";

const workflowRouter = Router();

workflowRouter.post("/subscription/reminders", sendReminderWorkflow);

export default workflowRouter;
