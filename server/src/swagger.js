import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "SavePoint Inventory API",
        version: "1.0.0",
        description:
        "Inventory management API for the SavePoint video game store. Includes products, suppliers, customers, sales, and reporting.",
    },
    servers: [
        {
        url: process.env.BASE_URL || "http://localhost:3000",
        description: "Current server",
        },
    ],
};

const options = {
    definition: swaggerDefinition,
    apis: [], 
};

export const swaggerSpec = swaggerJSDoc(options);

swaggerSpec.paths = {
    "/health": {
        get: {
        summary: "Health check",
        tags: ["System"],
        responses: {
            200: {
            description: "API is up",
            },
        },
        },
    },
    "/products": {
        get: {
        summary: "List all products with supplier and inventory info",
        tags: ["Products"],
        responses: {
            200: { description: "List of products" },
        },
        },
        post: {
        summary: "Create a new product",
        tags: ["Products"],
        requestBody: {
            required: true,
            content: {
            "application/json": {
                schema: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    platform: { type: "string" },
                    edition: { type: "string" },
                    genre: { type: "string" },
                    base_price: { type: "number" },
                    is_physical: { type: "boolean" },
                    is_digital: { type: "boolean" },
                    supplier_id: { type: "integer" },
                    quantity_on_hand: { type: "integer" },
                    reorder_level: { type: "integer" },
                },
                required: ["name", "supplier_id"],
                },
            },
            },
        },
        responses: {
            201: { description: "Product created" },
            400: { description: "Validation error" },
        },
        },
    },
    "/suppliers": {
        get: {
        summary: "List all suppliers",
        tags: ["Suppliers"],
        responses: { 200: { description: "List of suppliers" } },
        },
        post: {
        summary: "Create a supplier",
        tags: ["Suppliers"],
        responses: { 201: { description: "Supplier created" } },
        },
    },
    "/customers": {
        get: {
        summary: "List all customers",
        tags: ["Customers"],
        responses: { 200: { description: "List of customers" } },
        },
        post: {
        summary: "Create a customer",
        tags: ["Customers"],
        responses: { 201: { description: "Customer created" } },
        },
    },
    "/sales": {
        get: {
        summary: "List sales orders with totals",
        tags: ["Sales"],
        parameters: [
            {
            in: "query",
            name: "channel",
            schema: { type: "string", enum: ["in_store", "online"] },
            },
            {
            in: "query",
            name: "from",
            schema: { type: "string", format: "date-time" },
            },
            {
            in: "query",
            name: "to",
            schema: { type: "string", format: "date-time" },
            },
        ],
        responses: { 200: { description: "List of sales" } },
        },
        post: {
        summary: "Record a new sale (single product) via stored procedure",
        tags: ["Sales"],
        requestBody: {
            required: true,
            content: {
            "application/json": {
                schema: {
                type: "object",
                properties: {
                    customer_id: { type: "integer", nullable: true },
                    product_id: { type: "integer" },
                    quantity: { type: "integer" },
                    channel: {
                    type: "string",
                    enum: ["in_store", "online"],
                    },
                    payment_method: { type: "string" },
                    shipping_address: { type: "string", nullable: true },
                },
                required: ["product_id", "quantity"],
                },
            },
            },
        },
        responses: {
            201: { description: "Sale recorded" },
            400: { description: "Validation or stock error" },
        },
        },
    },
    "/inventory/receive": {
        post: {
        summary: "Receive stock for a product via stored procedure",
        tags: ["Inventory"],
        requestBody: {
            required: true,
            content: {
            "application/json": {
                schema: {
                type: "object",
                properties: {
                    product_id: { type: "integer" },
                    quantity: { type: "integer" },
                },
                required: ["product_id", "quantity"],
                },
            },
            },
        },
        responses: {
            200: { description: "Stock received successfully" },
            400: { description: "Validation error" },
        },
        },
    },
    "/inventory/low-stock": {
        get: {
        summary: "List products below their reorder level",
        tags: ["Inventory"],
        responses: { 200: { description: "List of low-stock items" } },
        },
    },
    "/reports/top-products": {
        get: {
        summary: "Top-selling products by units and revenue",
        tags: ["Reports"],
        parameters: [
            { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
            { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
            {
            in: "query",
            name: "channel",
            schema: { type: "string", enum: ["in_store", "online"] },
            },
            { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
        ],
        responses: {
            200: { description: "Aggregated stats for top products" },
        },
        },
    },
    "/reports/sales-by-channel": {
        get: {
        summary: "Aggregate sales by channel (in-store vs online)",
        tags: ["Reports"],
        parameters: [
            { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
            { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
            200: { description: "Aggregated sales and revenue per channel" },
        },
        },
    },
};

export { swaggerUi };
