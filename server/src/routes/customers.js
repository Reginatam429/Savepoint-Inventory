import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

//  GET /customers - List all customers
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            created_at
        FROM customers
        ORDER BY created_at DESC;
        `
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching customers", err);
        res.status(500).json({ error: "Failed to fetch customers" });
    }
});

//  GET /customers/:id - Get a single customer
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            created_at
        FROM customers
        WHERE id = $1;
        `,
        [id]
        );

        if (result.rowCount === 0) {
        return res.status(404).json({ error: "Customer not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching customer", err);
        res.status(500).json({ error: "Failed to fetch customer" });
    }
});

//  POST /customers - Create a new customer
router.post("/", async (req, res) => {
    const { name, email } = req.body;

    if (!name) {
        return res.status(400).json({ error: "name is required" });
    }

    try {
        const result = await pool.query(
        `
        INSERT INTO customers (name, email)
        VALUES ($1, $2)
        RETURNING id, name, email, created_at;
        `,
        [name, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating customer", err);
        res.status(500).json({ error: "Failed to create customer" });
    }
});

// PUT /customers/:id - Update a customer
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    try {
        const result = await pool.query(
        `
        UPDATE customers
        SET
            name = COALESCE($1, name),
            email = COALESCE($2, email)
        WHERE id = $3
        RETURNING id, name, email, created_at;
        `,
        [name, email, id]
        );

        if (result.rowCount === 0) {
        return res.status(404).json({ error: "Customer not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating customer", err);
        res.status(500).json({ error: "Failed to update customer" });
    }
});

//  DELETE /customers/:id - Delete a customer. For safety, prevent delete if there are sales_orders referencing this customer.
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Check for dependent sales orders
        const orderCountResult = await client.query(
        "SELECT COUNT(*) AS count FROM sales_orders WHERE customer_id = $1;",
        [id]
        );
        const orderCount = Number(orderCountResult.rows[0].count);

        if (orderCount > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
            error:
            "Cannot delete customer with existing sales. Consider anonymizing instead.",
        });
        }

        const deleteResult = await client.query(
        "DELETE FROM customers WHERE id = $1;",
        [id]
        );

        await client.query("COMMIT");

        if (deleteResult.rowCount === 0) {
        return res.status(404).json({ error: "Customer not found" });
        }

        res.status(204).send();
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting customer", err);
        res.status(500).json({ error: "Failed to delete customer" });
    } finally {
        client.release();
    }
});

export default router;
