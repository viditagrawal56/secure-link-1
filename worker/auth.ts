import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export const auth = (db: D1Database) =>
  betterAuth({
    database: drizzleAdapter(drizzle(db, { schema }), {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    logger: {
      disabled: false,
      level: "debug",
      log(level, message, ...args) {
        if (this.disabled) return;
        console.log(`[${level.toUpperCase()}] ${message}`, ...args);
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
      "http://localhost:5173",
      "https://testing.secure-link.workers.dev",
    ], // TODO: Add the worker domain
  });
