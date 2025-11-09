import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /suppliers - list all suppliers
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
        `
        SELECT
            id,
            name,
            contact_email,
            contact_phone,
            created_at
        FROM suppliers
        ORDER BY name;
        `
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching suppliers", err);
        res.status(500).json({ error: "Failed to fetch suppliers" });
    }
});

// GET /suppliers/:id - Get a single supplier by id
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
        `
        SELECT
            id,
            name,
            contact_email,
            contact_phone,
            created_at
        FROM suppliers
        WHERE id = $1;
        `,
        [id]
        );

        if (result.rowCount === 0) {
        return res.status(404).json({ error: "Supplier not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching supplier", err);
        res.status(500).json({ error: "Failed to fetch supplier" });
    }
});

// POST /suppliers - Create a new supplier
router.post("/", async (req, res) => {
    const { name, contact_email, contact_phone } = req.body;

    if (!name) {
        return res.status(400).json({ error: "name is required" });
    }

    try {
        const result = await pool.query(
        `
        INSERT INTO suppliers (name, contact_email, contact_phone)
        VALUES ($1, $2, $3)
        RETURNING id, name, contact_email, contact_phone, created_at;
        `,
        [name, contact_email, contact_phone]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating supplier", err);
        res.status(500).json({ error: "Failed to create supplier" });
    }
});

// PUT /suppliers/:id - Update a supplier (partial update)
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, contact_email, contact_phone } = req.body;

    try {
        const result = await pool.query(
        `
        UPDATE suppliers
        SET
            name = COALESCE($1, name),
            contact_email = COALESCE($2, contact_email),
            contact_phone = COALESCE($3, contact_phone)
        WHERE id = $4
        RETURNING id, name, contact_email, contact_phone, created_at;
        `,
        [name, contact_email, contact_phone, id]
        );

        if (result.rowCount === 0) {
        return res.status(404).json({ error: "Supplier not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating supplier", err);
        res.status(500).json({ error: "Failed to update supplier" });
    }
});

//  DELETE /suppliers/:id - Delete a supplier. For safety, will prevent delete if products still reference this supplier.
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Check for dependent products
        const productCountResult = await client.query(
        "SELECT COUNT(*) AS count FROM products WHERE supplier_id = $1;",
        [id]
        );
        const productCount = Number(productCountResult.rows[0].count);

        if (productCount > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
            error:
            "Cannot delete supplier with existing products. Reassign or remove products first.",
        });
        }

        const deleteResult = await client.query(
        "DELETE FROM suppliers WHERE id = $1;",
        [id]
    );

    await client.query("COMMIT");

    if (deleteResult.rowCount === 0) {
        return res.status(404).json({ error: "Supplier not found" });
    }

    res.status(204).send();
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting supplier", err);
        res.status(500).json({ error: "Failed to delete supplier" });
    } finally {
        client.release();
    }
});

export default router;
