import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * GET /reports/top-products
 *
 * Example query params:
 * - from: ISO date string (e.g. 2025-01-01)
 * - to:   ISO date string (e.g. 2025-02-01)
 * - channel: 'in_store' | 'online'
 * - limit: number of products to return (default 10)
 */
router.get("/top-products", async (req, res) => {
    const { from, to, channel, limit = 10 } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (from) {
        conditions.push(`so.order_date >= $${idx++}`);
        params.push(from);
    }

    if (to) {
        conditions.push(`so.order_date <= $${idx++}`);
        params.push(to);
    }

    if (channel) {
        conditions.push(`so.channel = $${idx++}`);
        params.push(channel);
    }

    const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
        SELECT
        p.id AS product_id,
        p.name,
        p.platform,
        p.genre,
        SUM(soi.quantity) AS total_units_sold,
        SUM(soi.quantity * soi.unit_price) AS total_revenue
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.order_id
        JOIN products p ON p.id = soi.product_id
        ${whereClause}
        GROUP BY p.id, p.name, p.platform, p.genre
        ORDER BY total_units_sold DESC
        LIMIT $${idx};
    `;

    params.push(Number(limit));

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching top products", err);
        res.status(500).json({ error: "Failed to fetch top products" });
    }
});

/**
 * GET /reports/sales-by-channel
 *
 * Example query params:
 * - from
 * - to
 */
router.get("/sales-by-channel", async (req, res) => {
    const { from, to } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (from) {
        conditions.push(`so.order_date >= $${idx++}`);
        params.push(from);
    }

    if (to) {
        conditions.push(`so.order_date <= $${idx++}`);
        params.push(to);
    }

    const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
        SELECT
        so.channel,
        COUNT(DISTINCT so.id) AS total_orders,
        SUM(soi.quantity * soi.unit_price) AS total_revenue
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.order_id = so.id
        ${whereClause}
        GROUP BY so.channel
        ORDER BY so.channel;
    `;

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching sales by channel", err);
        res.status(500).json({ error: "Failed to fetch sales by channel" });
    }
});

export default router;
