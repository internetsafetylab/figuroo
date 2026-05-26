import { Router, type IRouter } from "express";
import { db, ordersTable, inventoryTable } from "@workspace/db";
import { sql, and, gte, lt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics/summary", async (req, res) => {
  try {
    const allOrders = await db.select().from(ordersTable);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const ordersToday = allOrders.filter((o) => o.createdAt.toISOString().startsWith(todayStr)).length;

    const thisMonthOrders = allOrders.filter((o) => o.createdAt >= monthStart);
    const monthlyRevenue = thisMonthOrders.reduce((sum, o) => sum + parseFloat(o.orderPrice ?? "0"), 0);
    const monthlyProfit = thisMonthOrders.reduce((sum, o) => sum + parseFloat(o.profit ?? "0"), 0);

    const activeShipments = allOrders.filter((o) => o.status === "Shipped").length;
    const pendingOrders = allOrders.filter((o) => o.status === "Pending").length;
    const deliveredOrders = allOrders.filter((o) => o.status === "Delivered").length;

    const inventory = await db.select().from(inventoryTable);
    const lowStockCount = inventory.filter((i) => {
      const gramsLeft = parseFloat(i.gramsLeft ?? "9999");
      const threshold = parseFloat(i.lowStockThreshold ?? "0");
      return gramsLeft <= threshold;
    }).length;

    res.json({
      total_orders: allOrders.length,
      orders_today: ordersToday,
      monthly_revenue: Math.round(monthlyRevenue * 100) / 100,
      monthly_profit: Math.round(monthlyProfit * 100) / 100,
      active_shipments: activeShipments,
      pending_orders: pendingOrders,
      delivered_orders: deliveredOrders,
      low_stock_count: lowStockCount,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/revenue", async (req, res) => {
  try {
    const allOrders = await db.select().from(ordersTable);

    const byMonth: Record<string, { revenue: number; profit: number; order_count: number }> = {};

    for (const order of allOrders) {
      const d = order.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { revenue: 0, profit: 0, order_count: 0 };
      byMonth[key].revenue += parseFloat(order.orderPrice ?? "0");
      byMonth[key].profit += parseFloat(order.profit ?? "0");
      byMonth[key].order_count += 1;
    }

    const months = Object.keys(byMonth).sort().slice(-6);
    const result = months.map((m) => ({
      month: m,
      revenue: Math.round(byMonth[m].revenue * 100) / 100,
      profit: Math.round(byMonth[m].profit * 100) / 100,
      order_count: byMonth[m].order_count,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/top-products", async (req, res) => {
  try {
    const allOrders = await db.select().from(ordersTable);

    const byProduct: Record<string, { order_count: number; total_revenue: number }> = {};
    for (const order of allOrders) {
      const name = order.productName;
      if (!byProduct[name]) byProduct[name] = { order_count: 0, total_revenue: 0 };
      byProduct[name].order_count += 1;
      byProduct[name].total_revenue += parseFloat(order.orderPrice ?? "0");
    }

    const result = Object.entries(byProduct)
      .map(([product_name, stats]) => ({
        product_name,
        order_count: stats.order_count,
        total_revenue: Math.round(stats.total_revenue * 100) / 100,
      }))
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 10);

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/deadlines", async (req, res) => {
  try {
    const allOrders = await db.select().from(ordersTable);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split("T")[0];

    const urgent = allOrders.filter((o) => {
      if (!o.deadline) return false;
      if (o.status === "Delivered") return false;
      return o.deadline <= tomorrowStr;
    });

    res.json(
      urgent.map((row) => ({
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
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/courier-stats", async (req, res) => {
  try {
    const allOrders = await db.select().from(ordersTable);

    const byCourier: Record<string, { order_count: number; total_revenue: number }> = {};
    for (const order of allOrders) {
      const courier = order.courier ?? "Unknown";
      if (!byCourier[courier]) byCourier[courier] = { order_count: 0, total_revenue: 0 };
      byCourier[courier].order_count += 1;
      byCourier[courier].total_revenue += parseFloat(order.orderPrice ?? "0");
    }

    const result = Object.entries(byCourier).map(([courier, stats]) => ({
      courier,
      order_count: stats.order_count,
      total_revenue: Math.round(stats.total_revenue * 100) / 100,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
