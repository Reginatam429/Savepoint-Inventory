import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./db.js";
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

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like Swagger UI or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
        return callback(null, true);
        } else {
        return callback(new Error("CORS not allowed from this origin"), false);
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
}));

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