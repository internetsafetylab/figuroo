import { pgTable, serial, text, timestamp, boolean, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminTokensTable = pgTable("admin_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  usageCount: bigint("usage_count", { mode: "number" }).default(0),
});

export const insertAdminTokenSchema = createInsertSchema(adminTokensTable).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  usageCount: true,
});

export type InsertAdminToken = z.infer<typeof insertAdminTokenSchema>;
export type AdminToken = typeof adminTokensTable.$inferSelect;
