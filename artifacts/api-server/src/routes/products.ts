import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  try {
    const rows = await db.select().from(productsTable).orderBy(productsTable.createdAt);
    res.json(rows.map(formatProduct));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const body = CreateProductBody.parse(req.body);
    const [row] = await db
      .insert(productsTable)
      .values({
        name: body.name,
        filamentUsedGrams: body.filament_used_grams?.toString(),
        defaultPrice: body.default_price?.toString(),
        imageUrl: body.image_url,
      })
      .returning();
    res.status(201).json(formatProduct(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const { id } = UpdateProductParams.parse({ id: Number(req.params.id) });
    const body = UpdateProductBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.filament_used_grams !== undefined) updateData.filamentUsedGrams = body.filament_used_grams?.toString();
    if (body.default_price !== undefined) updateData.defaultPrice = body.default_price?.toString();
    if (body.image_url !== undefined) updateData.imageUrl = body.image_url;

    const [row] = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = DeleteProductParams.parse({ id: Number(req.params.id) });
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatProduct(row: typeof productsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    filament_used_grams: row.filamentUsedGrams ? parseFloat(row.filamentUsedGrams) : null,
    default_price: row.defaultPrice ? parseFloat(row.defaultPrice) : null,
    image_url: row.imageUrl ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

export default router;
