import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * POST /sales
 * Record a single-product sale via sp_record_sale.
 *
 * Body:
 * {
 *   "customer_id": 1,           // nullable for guest sales
 *   "product_id": 1,
 *   "quantity": 2,
 *   "channel": "in_store",      // or "online"
 *   "payment_method": "cash",   // or "credit_card", "paypal", etc.
 *   "shipping_address": null    // only used for online
 * }
 */
router.post("/", async (req, res) => {
    const {
        customer_id = null,
        product_id,
        quantity,
        channel = "in_store",
        payment_method = null,
        shipping_address = null,
    } = req.body;

    if (!product_id || !quantity) {
        return res
        .status(400)
        .json({ error: "product_id and quantity are required" });
    }

    try {
        const result = await pool.query(
        `SELECT sp_record_sale($1, $2, $3, $4, $5, $6) AS order_id;`,
        [customer_id, product_id, quantity, channel, payment_method, shipping_address]
        );

        const orderId = result.rows[0].order_id;
        res.status(201).json({ order_id: orderId });
    } catch (err) {
        console.error("Error recording sale", err);
        // sp_record_sale raises exceptions for bad input / insufficient stock
        res.status(400).json({ error: err.message });
    }
});

// GET /sales - List sales with basic info + total order amount. Optional query params: ?channel=online&from=2025-01-01&to=2025-02-01
router.get("/", async (req, res) => {
    const { channel, from, to } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (channel) {
        conditions.push(`so.channel = $${idx++}`);
        params.push(channel);
    }
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
        so.id AS order_id,
        so.order_date,
        so.channel,
        so.payment_method,
        so.status,
        c.name AS customer_name,
        SUM(soi.quantity * soi.unit_price) AS total_amount
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.order_id = so.id
        LEFT JOIN customers c ON c.id = so.customer_id
        ${whereClause}
        GROUP BY
        so.id,
        so.order_date,
        so.channel,
        so.payment_method,
        so.status,
        c.name
        ORDER BY so.order_date DESC;
    `;

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching sales", err);
        res.status(500).json({ error: "Failed to fetch sales" });
    }
});

export default router;
