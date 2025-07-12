import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const shortUrls = sqliteTable("short_url", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  shortCode: text("short_code").notNull().unique(),
  originalUrl: text("original_url").notNull(),
  isProtected: integer("is_protected", { mode: "boolean" })
    .default(false)
    .notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const protectedUrlAuthorizedEmails = sqliteTable(
  "protected_url_authorized_emails",
  {
    id: text("id").primaryKey(),
    shortUrlId: text("short_url_id")
      .notNull()
      .references(() => shortUrls.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
  }
);

export const urlAccessVerification = sqliteTable("url_access_verification", {
  id: text("id").primaryKey(),
  shortUrlId: text("short_url_id")
    .notNull()
    .references(() => shortUrls.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  used: integer("used", { mode: "boolean" }).default(false).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Realtions

export const shortUrlsRelations = relations(shortUrls, ({ many }) => ({
  authorizedEmails: many(protectedUrlAuthorizedEmails),
}));

export const protectedUrlAuthorizedEmailsRelations = relations(
  protectedUrlAuthorizedEmails,
  ({ one }) => ({
    shortUrl: one(shortUrls, {
      fields: [protectedUrlAuthorizedEmails.shortUrlId],
      references: [shortUrls.id],
    }),
  })
);

export const urlAccessVerificationRelations = relations(
  urlAccessVerification,
  ({ one }) => ({
    shortUrl: one(shortUrls, {
      fields: [urlAccessVerification.shortUrlId],
      references: [shortUrls.id],
    }),
  })
);
