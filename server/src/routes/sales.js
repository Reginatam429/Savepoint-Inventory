import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// POST /sales - record a single-product sale
router.post("/", async (req, res) => {
    const {
        customer_id,      // can be null for guest
        product_id,
        quantity,
        channel = "in_store",
        payment_method,
        shipping_address
    } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).json({ error: "product_id and quantity are required" });
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
        res.status(400).json({ error: err.message });
    }
});

export default router;
