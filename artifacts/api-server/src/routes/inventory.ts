import { Router, type IRouter } from "express";
import { db, inventoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateInventoryItemBody,
  UpdateInventoryItemBody,
  UpdateInventoryItemParams,
  DeleteInventoryItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory", async (req, res) => {
  try {
    const rows = await db.select().from(inventoryTable).orderBy(inventoryTable.createdAt);
    res.json(rows.map(formatItem));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const body = CreateInventoryItemBody.parse(req.body);
    const [row] = await db
      .insert(inventoryTable)
      .values({
        filamentName: body.filament_name,
        color: body.color,
        gramsLeft: body.grams_left?.toString(),
        costPerKg: body.cost_per_kg?.toString(),
        lowStockThreshold: body.low_stock_threshold?.toString(),
      })
      .returning();
    res.status(201).json(formatItem(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/inventory/:id", async (req, res) => {
  try {
    const { id } = UpdateInventoryItemParams.parse({ id: Number(req.params.id) });
    const body = UpdateInventoryItemBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.filament_name !== undefined) updateData.filamentName = body.filament_name;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.grams_left !== undefined) updateData.gramsLeft = body.grams_left?.toString();
    if (body.cost_per_kg !== undefined) updateData.costPerKg = body.cost_per_kg?.toString();
    if (body.low_stock_threshold !== undefined) updateData.lowStockThreshold = body.low_stock_threshold?.toString();

    const [row] = await db
      .update(inventoryTable)
      .set(updateData)
      .where(eq(inventoryTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatItem(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/inventory/:id", async (req, res) => {
  try {
    const { id } = DeleteInventoryItemParams.parse({ id: Number(req.params.id) });
    await db.delete(inventoryTable).where(eq(inventoryTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatItem(row: typeof inventoryTable.$inferSelect) {
  return {
    id: row.id,
    filament_name: row.filamentName,
    color: row.color ?? null,
    grams_left: row.gramsLeft ? parseFloat(row.gramsLeft) : null,
    cost_per_kg: row.costPerKg ? parseFloat(row.costPerKg) : null,
    low_stock_threshold: row.lowStockThreshold ? parseFloat(row.lowStockThreshold) : null,
    created_at: row.createdAt.toISOString(),
  };
}

export default router;
