import mongoose from "mongoose";
import { verifyWorkflowRequest } from "../middleware/workflow.middleware.js";
import { authorize, authorizeAdmin } from "../middleware/auth.middleware.js";
import { getUserById, updateUserRole } from "../controllers/user.controllers.js";
import {
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
} from "../controllers/subscriptions.controllers.js";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";

// Mock helper to create mock req and res
const createMockReqRes = (options = {}) => {
  const req = {
    headers: options.headers || {},
    cookies: options.cookies || {},
    params: options.params || {},
    body: options.body || {},
    query: options.query || {},
    user: options.user || null,
    method: options.method || "GET",
    originalUrl: options.originalUrl || "/test",
    ip: options.ip || "127.0.0.1",
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatus: () => statusCode,
    getData: () => responseData,
  };

  return { req, res };
};

let testsPassed = 0;
let testsFailed = 0;

const assert = (condition, testName) => {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    testsFailed++;
  }
};

const runTests = async () => {
  console.log("\n==========================================");
  console.log("RUNNING SECURITY & AUTHORIZATION TESTS");
  console.log("==========================================\n");

  // --- Test Suite 1: Workflow Middleware Protection ---
  console.log("Suite 1: Workflow Middleware Security");

  // Case 1.1: Missing secret when WORKFLOW_SECRET or signing keys configured
  process.env.WORKFLOW_SECRET = "super-secret-key-123";
  {
    const { req, res } = createMockReqRes({
      headers: {},
      method: "POST",
      originalUrl: "/api/v1/workflow/subscription/reminders",
    });
    let nextCalled = false;
    verifyWorkflowRequest(req, res, () => { nextCalled = true; });

    assert(!nextCalled, "Workflow endpoint blocks request without secret");
    assert(res.getStatus() === 401, "Workflow endpoint returns 401 when unauthenticated");
  }

  // Case 1.2: Incorrect secret
  {
    const { req, res } = createMockReqRes({
      headers: { "x-workflow-secret": "wrong-secret" },
      method: "POST",
      originalUrl: "/api/v1/workflow/subscription/reminders",
    });
    let nextCalled = false;
    verifyWorkflowRequest(req, res, () => { nextCalled = true; });

    assert(!nextCalled, "Workflow endpoint blocks request with wrong secret");
    assert(res.getStatus() === 401, "Workflow endpoint returns 401 for wrong secret");
  }

  // Case 1.3: Correct secret
  {
    const { req, res } = createMockReqRes({
      headers: { "x-workflow-secret": "super-secret-key-123" },
      method: "POST",
      originalUrl: "/api/v1/workflow/subscription/reminders",
    });
    let nextCalled = false;
    verifyWorkflowRequest(req, res, () => { nextCalled = true; });

    assert(nextCalled, "Workflow endpoint allows request with valid x-workflow-secret");
  }

  // --- Test Suite 2: Auth Middleware & Telemetry ---
  console.log("\nSuite 2: Auth Middleware Telemetry & Validation");

  // Case 2.1: Missing token
  {
    const { req, res } = createMockReqRes({
      headers: {},
      originalUrl: "/api/v1/users/123",
    });
    let nextCalled = false;
    await authorize(req, res, () => { nextCalled = true; });

    assert(!nextCalled, "Auth middleware blocks requests missing token");
    assert(res.getStatus() === 401, "Auth middleware returns 401 on missing token");
  }

  // Case 2.2: Invalid JWT
  {
    const { req, res } = createMockReqRes({
      headers: { authorization: "Bearer invalid.jwt.token" },
      originalUrl: "/api/v1/users/123",
    });
    let nextCalled = false;
    await authorize(req, res, () => { nextCalled = true; });

    assert(!nextCalled, "Auth middleware blocks invalid JWT");
    assert(res.getStatus() === 401, "Auth middleware returns 401 on invalid JWT");
  }

  // Case 2.3: Admin check on regular user
  {
    const { req, res } = createMockReqRes({
      user: { _id: new mongoose.Types.ObjectId(), role: "user" },
      originalUrl: "/api/v1/users",
    });
    let nextCalled = false;
    await authorizeAdmin(req, res, () => { nextCalled = true; });

    assert(!nextCalled, "Admin middleware blocks regular user");
    assert(res.getStatus() === 403, "Admin middleware returns 403 Forbidden");
  }

  // Case 2.4: Admin check on admin user
  {
    const { req, res } = createMockReqRes({
      user: { _id: new mongoose.Types.ObjectId(), role: "admin" },
      originalUrl: "/api/v1/users",
    });
    let nextCalled = false;
    await authorizeAdmin(req, res, () => { nextCalled = true; });

    assert(nextCalled, "Admin middleware permits admin user");
  }

  // --- Test Suite 3: User Controller Hardening ---
  console.log("\nSuite 3: User Controller Hardening & Ownership Verification");

  // Case 3.1: Invalid ObjectId in getUserById
  {
    const { req, res } = createMockReqRes({
      params: { id: "invalid-id" },
      user: { _id: new mongoose.Types.ObjectId(), role: "user" },
    });
    await getUserById(req, res, () => {});

    assert(res.getStatus() === 400, "getUserById returns 400 for invalid ObjectId");
  }

  // Mock User.findById
  const targetUserId = new mongoose.Types.ObjectId();
  const ownerId = targetUserId;
  const strangerId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const mockUserDoc = {
    _id: targetUserId,
    username: "targetuser",
    email: "target@example.com",
    role: "user",
    createdAt: new Date(),
  };

  User.findById = (id) => ({
    select: () => ({
      lean: async () => (id.toString() === targetUserId.toString() ? mockUserDoc : null),
    }),
  });

  // Case 3.2: Non-owner & non-admin accessing user profile
  {
    const { req, res } = createMockReqRes({
      params: { id: targetUserId.toString() },
      user: { _id: strangerId, role: "user" },
    });
    await getUserById(req, res, () => {});

    assert(res.getStatus() === 403, "getUserById returns 403 Forbidden for non-owner non-admin");
  }

  // Case 3.3: Owner accessing own profile
  {
    const { req, res } = createMockReqRes({
      params: { id: targetUserId.toString() },
      user: { _id: ownerId, role: "user" },
    });
    await getUserById(req, res, () => {});

    assert(res.getStatus() === 200, "getUserById returns 200 OK for owner");
    assert(res.getData().data.email === "target@example.com", "getUserById returns owner profile data");
  }

  // Case 3.4: Admin accessing user profile
  {
    const { req, res } = createMockReqRes({
      params: { id: targetUserId.toString() },
      user: { _id: adminId, role: "admin" },
    });
    await getUserById(req, res, () => {});

    assert(res.getStatus() === 200, "getUserById returns 200 OK for admin");
    assert(res.getData().data.email === "target@example.com", "getUserById returns profile data to admin");
  }

  // Case 3.5: User not found
  {
    const missingId = new mongoose.Types.ObjectId();
    const { req, res } = createMockReqRes({
      params: { id: missingId.toString() },
      user: { _id: adminId, role: "admin" },
    });
    await getUserById(req, res, () => {});

    assert(res.getStatus() === 404, "getUserById returns 404 for non-existent user");
  }

  // --- Test Suite 4: Role Update Controller ---
  console.log("\nSuite 4: Role Update Controller Validation");

  User.countDocuments = async () => 2;
  User.findByIdAndUpdate = (id, update) => ({
    select: () => ({
      lean: async () => ({ ...mockUserDoc, role: update.role }),
    }),
  });

  // Case 4.1: Invalid role parameter
  {
    const { req, res } = createMockReqRes({
      params: { id: targetUserId.toString() },
      body: { role: "superadmin" },
      user: { _id: adminId, role: "admin" },
    });
    await updateUserRole(req, res, () => {});

    assert(res.getStatus() === 400, "updateUserRole rejects invalid role");
  }

  // Case 4.2: Valid role update
  {
    const { req, res } = createMockReqRes({
      params: { id: targetUserId.toString() },
      body: { role: "admin" },
      user: { _id: adminId, role: "admin" },
    });
    await updateUserRole(req, res, () => {});

    assert(res.getStatus() === 200, "updateUserRole successfully updates role");
    assert(res.getData().data.role === "admin", "updateUserRole returns updated role");
  }

  // Case 4.3: Prevent sole admin from demoting themselves
  {
    User.countDocuments = async () => 1;
    const { req, res } = createMockReqRes({
      params: { id: adminId.toString() },
      body: { role: "user" },
      user: { _id: adminId, role: "admin" },
    });
    await updateUserRole(req, res, () => {});

    assert(res.getStatus() === 400, "updateUserRole prevents sole admin self-demotion");
  }

  // --- Test Suite 5: Subscription Ownership & Authorization ---
  console.log("\nSuite 5: Subscription Ownership & Authorization");

  const subId = new mongoose.Types.ObjectId();
  const mockSubDoc = {
    _id: subId,
    name: "Spotify Premium",
    price: 10,
    user: ownerId,
    status: "active",
    equals(otherId) {
      return this._id.toString() === otherId.toString();
    },
  };

  const createSubInstance = () => ({
    ...mockSubDoc,
    user: {
      equals: (otherId) => otherId.toString() === ownerId.toString(),
      toString: () => ownerId.toString(),
    },
    save: async () => {},
  });

  Subscription.findById = (id) => ({
    lean: async () => (id.toString() === subId.toString() ? createSubInstance() : null),
    then: (resolve) => resolve(createSubInstance()),
  });
  Subscription.findByIdAndUpdate = (id, body) => ({
    lean: async () => ({ ...mockSubDoc, ...body }),
  });

  // Case 5.1: Non-owner non-admin viewing subscription
  {
    const { req, res } = createMockReqRes({
      params: { id: subId.toString() },
      user: { _id: strangerId, role: "user" },
    });
    await getSubscriptionById(req, res);

    assert(res.getStatus() === 403, "getSubscriptionById rejects non-owner non-admin");
  }

  // Case 5.2: Owner viewing subscription
  {
    const { req, res } = createMockReqRes({
      params: { id: subId.toString() },
      user: { _id: ownerId, role: "user" },
    });
    await getSubscriptionById(req, res);

    assert(res.getStatus() === 200, "getSubscriptionById allows owner access");
  }

  // Case 5.3: Non-owner non-admin updating subscription
  {
    const { req, res } = createMockReqRes({
      params: { id: subId.toString() },
      body: { name: "Hacked Spotify" },
      user: { _id: strangerId, role: "user" },
    });
    await updateSubscription(req, res);

    assert(res.getStatus() === 403, "updateSubscription rejects non-owner non-admin");
  }

  // Case 5.4: Owner updating subscription
  {
    const { req, res } = createMockReqRes({
      params: { id: subId.toString() },
      body: { name: "Spotify Family" },
      user: { _id: ownerId, role: "user" },
    });
    await updateSubscription(req, res);

    assert(res.getStatus() === 200, "updateSubscription allows owner update");
  }

  // Case 5.5: Non-owner non-admin canceling subscription
  {
    const { req, res } = createMockReqRes({
      params: { id: subId.toString() },
      user: { _id: strangerId, role: "user" },
    });
    await cancelSubscription(req, res);

    assert(res.getStatus() === 403, "cancelSubscription rejects non-owner non-admin");
  }

  // Case 5.6: Owner canceling subscription
  {
    const { req, res } = createMockReqRes({
      params: { id: subId.toString() },
      user: { _id: ownerId, role: "user" },
    });
    await cancelSubscription(req, res);

    assert(res.getStatus() === 200, "cancelSubscription allows owner cancellation");
  }

  console.log("\n==========================================");
  console.log(`TEST SUMMARY: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("==========================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
