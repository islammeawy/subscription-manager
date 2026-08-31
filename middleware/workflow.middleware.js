import {
  WORKFLOW_SECRET,
  QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY,
  NODE_ENV,
} from "../config/env.js";

/**
 * Middleware to verify that incoming workflow webhook requests originate from
 * an authorized source (QStash with signature or requests with a valid workflow secret).
 */
export const verifyWorkflowRequest = (req, res, next) => {
  const clientIp = req.ip || req.connection?.remoteAddress || "unknown";

  const currentSigningKey =
    process.env.QSTASH_CURRENT_SIGNING_KEY || QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey =
    process.env.QSTASH_NEXT_SIGNING_KEY || QSTASH_NEXT_SIGNING_KEY;
  const workflowSecret = process.env.WORKFLOW_SECRET || WORKFLOW_SECRET;
  const nodeEnv = process.env.NODE_ENV || NODE_ENV;

  const hasSigningKeys = Boolean(currentSigningKey && nextSigningKey);
  const hasSecretConfigured = Boolean(workflowSecret);

  // If a workflow secret is configured, check if the request provides the correct secret header
  const incomingSecret =
    req.headers["x-workflow-secret"] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.substring(7)
      : undefined);

  if (hasSecretConfigured) {
    if (incomingSecret === workflowSecret) {
      return next();
    }
  }

  // Check if QStash signature header is present
  const hasSignatureHeader = Boolean(
    req.headers["upstash-signature"] || req.headers["Upstash-Signature"],
  );

  // If signing keys are configured and a signature header is present, Upstash `serve`
  // will perform cryptographic verification of the signature.
  if (hasSigningKeys && hasSignatureHeader) {
    return next();
  }

  // If secret or signing keys are configured and validation failed
  if (hasSecretConfigured || hasSigningKeys) {
    console.warn(
      `[SECURITY AUDIT] Unauthorized workflow webhook trigger attempt from IP: ${clientIp} to ${req.originalUrl}`,
    );
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid or missing workflow authentication credentials.",
    });
  }

  // In production, block if webhook is unprotected
  if (nodeEnv === "production") {
    console.warn(
      `[SECURITY AUDIT] Rejected unauthenticated workflow trigger in production environment from IP: ${clientIp}`,
    );
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Workflow signing keys or WORKFLOW_SECRET must be configured in production.",
    });
  }

  next();
};

export default verifyWorkflowRequest;
