import express from "express";
import dotenv from "dotenv";
import { pool } from "./db.js";
import cors from "cors";
import productsRouter from "./routes/products.js";
import suppliersRouter from "./routes/suppliers.js";
import customersRouter from "./routes/customers.js";
import salesRouter from "./routes/sales.js";
import inventoryRouter from "./routes/inventory.js";
import reportsRouter from "./routes/reports.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.redirect("/docs");
});

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
app.use("/reports", reportsRouter);

// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`API running on port ${PORT}`);
    });
}

export default app;