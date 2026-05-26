import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  UpdateOrderBody,
  UpdateOrderStatusBody,
  GetOrderParams,
  UpdateOrderParams,
  DeleteOrderParams,
  UpdateOrderStatusParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/orders", async (req, res) => {
  try {
    const query = ListOrdersQueryParams.parse(req.query);
    let rows = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);

    if (query.status) {
      rows = rows.filter((r) => r.status === query.status);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.customerName.toLowerCase().includes(s) ||
          r.productName.toLowerCase().includes(s) ||
          (r.awbCode ?? "").toLowerCase().includes(s)
      );
    }

    res.json(rows.map(formatOrder));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const body = CreateOrderBody.parse(req.body);
    const [row] = await db
      .insert(ordersTable)
      .values({
        customerName: body.customer_name,
        productName: body.product_name,
        productColor: body.product_color,
        material: body.material,
        orderPrice: body.order_price?.toString(),
        shippingPrice: body.shipping_price?.toString(),
        filamentCost: body.filament_cost?.toString(),
        courier: body.courier,
        awbCode: body.awb_code,
        easyboxQrImageUrl: body.easybox_qr_image_url,
        status: body.status ?? "Pending",
        deadline: body.deadline,
        notes: body.notes,
      })
      .returning();
    const profit = calcProfit(row);
    const [updated] = await db
      .update(ordersTable)
      .set({ profit: profit?.toString() })
      .where(eq(ordersTable.id, row.id))
      .returning();
    res.status(201).json(formatOrder(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatOrder(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const { id } = UpdateOrderParams.parse({ id: Number(req.params.id) });
    const body = UpdateOrderBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.customer_name !== undefined) updateData.customerName = body.customer_name;
    if (body.product_name !== undefined) updateData.productName = body.product_name;
    if (body.product_color !== undefined) updateData.productColor = body.product_color;
    if (body.material !== undefined) updateData.material = body.material;
    if (body.order_price !== undefined) updateData.orderPrice = body.order_price?.toString();
    if (body.shipping_price !== undefined) updateData.shippingPrice = body.shipping_price?.toString();
    if (body.filament_cost !== undefined) updateData.filamentCost = body.filament_cost?.toString();
    if (body.courier !== undefined) updateData.courier = body.courier;
    if (body.awb_code !== undefined) updateData.awbCode = body.awb_code;
    if (body.easybox_qr_image_url !== undefined) updateData.easyboxQrImageUrl = body.easybox_qr_image_url;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.deadline !== undefined) updateData.deadline = body.deadline;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const [row] = await db
      .update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const profit = calcProfit(row);
    const [updated] = await db
      .update(ordersTable)
      .set({ profit: profit?.toString() })
      .where(eq(ordersTable.id, id))
      .returning();
    res.json(formatOrder(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = DeleteOrderParams.parse({ id: Number(req.params.id) });
    await db.delete(ordersTable).where(eq(ordersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = UpdateOrderStatusParams.parse({ id: Number(req.params.id) });
    const body = UpdateOrderStatusBody.parse(req.body);
    const [row] = await db
      .update(ordersTable)
      .set({ status: body.status })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatOrder(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function calcProfit(row: { orderPrice: string | null; shippingPrice: string | null; filamentCost: string | null }) {
  const price = parseFloat(row.orderPrice ?? "0");
  const shipping = parseFloat(row.shippingPrice ?? "0");
  const filament = parseFloat(row.filamentCost ?? "0");
  if (isNaN(price)) return null;
  return price - shipping - filament;
}

function formatOrder(row: typeof ordersTable.$inferSelect) {
  return {
    id: row.id,
    customer_name: row.customerName,
    product_name: row.productName,
    product_color: row.productColor ?? null,
    material: row.material ?? null,
    order_price: row.orderPrice ? parseFloat(row.orderPrice) : null,
    shipping_price: row.shippingPrice ? parseFloat(row.shippingPrice) : null,
    filament_cost: row.filamentCost ? parseFloat(row.filamentCost) : null,
    profit: row.profit ? parseFloat(row.profit) : null,
    courier: row.courier ?? null,
    awb_code: row.awbCode ?? null,
    easybox_qr_image_url: row.easyboxQrImageUrl ?? null,
    status: row.status,
    deadline: row.deadline ?? null,
    notes: row.notes ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

export default router;
