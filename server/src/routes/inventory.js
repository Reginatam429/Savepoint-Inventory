import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * POST /inventory/receive
 * Receive new stock via sp_receive_stock.
 *
 * Body:
 * {
 *   "product_id": 1,
 *   "quantity": 10
 * }
 */
router.post("/receive", async (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res
        .status(400)
        .json({ error: "product_id and quantity are required" });
    }

    try {
        await pool.query(`SELECT sp_receive_stock($1, $2);`, [
        product_id,
        quantity,
        ]);

        res.status(200).json({ message: "Stock received successfully" });
    } catch (err) {
        console.error("Error receiving stock", err);
        res.status(400).json({ error: err.message });
    }
});

//  GET /inventory/low-stock - List products below their reorder_level.
router.get("/low-stock", async (req, res) => {
    try {
        const result = await pool.query(
        `
        SELECT
            p.id AS product_id,
            p.name,
            p.platform,
            i.quantity_on_hand,
            i.reorder_level,
            s.name AS supplier_name
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        JOIN suppliers s ON s.id = p.supplier_id
        WHERE i.quantity_on_hand < i.reorder_level
        ORDER BY i.quantity_on_hand ASC;
        `
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching low-stock inventory", err);
        res.status(500).json({ error: "Failed to fetch low-stock items" });
    }
});

export default router;
