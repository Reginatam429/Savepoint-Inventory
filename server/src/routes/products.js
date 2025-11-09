import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /products - list all products with supplier + inventory info
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            p.id,
            p.name,
            p.platform,
            p.edition,
            p.genre,
            p.base_price,
            p.is_physical,
            p.is_digital,
            p.supplier_id,
            s.name AS supplier_name,
            i.quantity_on_hand,
            i.reorder_level
        FROM products p
        JOIN suppliers s ON s.id = p.supplier_id
        JOIN inventory i ON i.product_id = p.id
        ORDER BY p.name;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching products", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// POST /products - create product + its inventory row
router.post("/", async (req, res) => {
    const {
        name,
        platform,
        edition,
        genre,
        base_price,
        is_physical = true,
        is_digital = false,
        supplier_id,
        quantity_on_hand = 0,
        reorder_level = 5,
    } = req.body;

    if (!name || !supplier_id) {
        return res.status(400).json({ error: "name and supplier_id are required" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const productInsert = await client.query(
        `
        INSERT INTO products
            (name, platform, edition, genre, base_price, is_physical, is_digital, supplier_id)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
        `,
        [name, platform, edition, genre, base_price, is_physical, is_digital, supplier_id]
        );

        const product = productInsert.rows[0];

        await client.query(
        `
        INSERT INTO inventory (product_id, quantity_on_hand, reorder_level)
        VALUES ($1, $2, $3);
        `,
        [product.id, quantity_on_hand, reorder_level]
        );

        await client.query("COMMIT");
        res.status(201).json(product);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error creating product", err);
        res.status(500).json({ error: "Failed to create product" });
    } finally {
        client.release();
    }
});

// PUT /products/:id - update product fields (not inventory)
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const {
        name,
        platform,
        edition,
        genre,
        base_price,
        is_physical,
        is_digital,
        supplier_id,
    } = req.body;

    try {
        const result = await pool.query(
        `
        UPDATE products
        SET
            name = COALESCE($1, name),
            platform = COALESCE($2, platform),
            edition = COALESCE($3, edition),
            genre = COALESCE($4, genre),
            base_price = COALESCE($5, base_price),
            is_physical = COALESCE($6, is_physical),
            is_digital = COALESCE($7, is_digital),
            supplier_id = COALESCE($8, supplier_id)
        WHERE id = $9
        RETURNING *;
        `,
        [name, platform, edition, genre, base_price, is_physical, is_digital, supplier_id, id]
        );

        if (result.rowCount === 0) {
        return res.status(404).json({ error: "Product not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating product", err);
        res.status(500).json({ error: "Failed to update product" });
    }
});

// DELETE /products/:id - delete product + inventory row
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query("DELETE FROM inventory WHERE product_id = $1;", [id]);
        const result = await client.query("DELETE FROM products WHERE id = $1;", [id]);

        await client.query("COMMIT");

        if (result.rowCount === 0) {
        return res.status(404).json({ error: "Product not found" });
        }

        res.status(204).send();
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting product", err);
        res.status(500).json({ error: "Failed to delete product" });
    } finally {
        client.release();
    }
});

export default router;
