import express from "express";
import dotenv from "dotenv";
import { pool } from "./db.js";
import productsRouter from "./routes/products.js";
import suppliersRouter from "./routes/suppliers.js";
import customersRouter from "./routes/customers.js";
import salesRouter from "./routes/sales.js";
import inventoryRouter from "./routes/inventory.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ status: "ok", time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error" });
    }
});

// Endpoints
app.use("/products", productsRouter);
app.use("/suppliers", suppliersRouter);
app.use("/customers", customersRouter);
app.use("/sales", salesRouter);
app.use("/inventory", inventoryRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
