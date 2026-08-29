import { config } from "dotenv";
import { resolve } from "node:path";

const envName = process.env.NODE_ENV || "development";
const envFile = resolve(process.cwd(), `.env.${envName}.local`);

config({ path: envFile });

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || envName;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
// Prefer the common uppercase env var `ARCJET_KEY`, but fall back to legacy `Arcjet_KEY`.
export const Arcjet_KEY = process.env.ARCJET_KEY || process.env.Arcjet_KEY;
export const Arcjet_ENV = process.env.Arcjet_ENV || "development";

export const QSTASH_URL = process.env.QSTASH_URL;
export const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
export const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
