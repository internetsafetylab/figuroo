import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  filamentName: text("filament_name").notNull(),
  color: text("color"),
  gramsLeft: numeric("grams_left", { precision: 10, scale: 2 }),
  costPerKg: numeric("cost_per_kg", { precision: 10, scale: 2 }),
  lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({
  id: true,
  createdAt: true,
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryItem = typeof inventoryTable.$inferSelect;
