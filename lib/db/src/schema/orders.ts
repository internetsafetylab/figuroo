import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  productName: text("product_name").notNull(),
  productColor: text("product_color"),
  material: text("material"),
  orderPrice: numeric("order_price", { precision: 10, scale: 2 }),
  shippingPrice: numeric("shipping_price", { precision: 10, scale: 2 }),
  filamentCost: numeric("filament_cost", { precision: 10, scale: 2 }),
  profit: numeric("profit", { precision: 10, scale: 2 }),
  courier: text("courier"),
  awbCode: text("awb_code"),
  easyboxQrImageUrl: text("easybox_qr_image_url"),
  status: text("status").notNull().default("Pending"),
  deadline: text("deadline"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
