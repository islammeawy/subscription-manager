import mongoose from "mongoose";
import connectDatabase from "../database/mongodb.js";
import User from "../models/user.model.js";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("--")) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }

  return parsed;
};

const run = async () => {
  const args = parseArgs();

  const email = (args.email || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const username = (args.username || process.env.ADMIN_USERNAME || "").trim();
  const password = args.password || process.env.ADMIN_PASSWORD || "";
  const promoteOnly = Boolean(args.promote);

  if (!email && !username) {
    console.error(`
Usage:
  node scripts/create-admin.js --email <email> --username <username> --password <password>
  node scripts/create-admin.js --promote --email <email>
  node scripts/create-admin.js --promote --username <username>

Options:
  --email       Admin user email address
  --username    Admin user username
  --password    Admin user password (required when creating a new user)
  --promote     Promote an existing user to admin without creating a new user
`);
    process.exit(1);
  }

  const isConnected = await connectDatabase();
  if (!isConnected) {
    console.error("Failed to connect to MongoDB database.");
    process.exit(1);
  }

  try {
    const query = [];
    if (email) query.push({ email });
    if (username) query.push({ username });

    let user = await User.findOne({ $or: query });

    if (user) {
      if (user.role === "admin") {
        console.log(`User '${user.username}' (${user.email}) is already an administrator.`);
      } else {
        user.role = "admin";
        await user.save();
        console.log(`Successfully promoted existing user '${user.username}' (${user.email}) to role 'admin'.`);
      }
    } else {
      if (promoteOnly) {
        console.error(`User not found with provided email/username for promotion.`);
        process.exit(1);
      }

      if (!email || !username || !password) {
        console.error("Error: --email, --username, and --password are required to create a new admin user.");
        process.exit(1);
      }

      if (password.length < 6) {
        console.error("Error: Password must be at least 6 characters long.");
        process.exit(1);
      }

      user = await User.create({
        username,
        email,
        password,
        role: "admin",
      });

      console.log(`Successfully created new administrator user '${user.username}' (${user.email}).`);
    }
  } catch (err) {
    console.error("Error creating/promoting admin user:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
