import request from "supertest";
import app from "../src/server.js";

describe("Reports API (integration)", () => {
    test("GET /reports/top-products returns aggregated stats", async () => {
        const res = await request(app).get("/reports/top-products?limit=5");

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        if (res.body.length > 0) {
        const row = res.body[0];
        expect(row).toHaveProperty("product_id");
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("total_units_sold");
        expect(row).toHaveProperty("total_revenue");
        }
    });

    test("GET /reports/sales-by-channel returns revenue per channel", async () => {
        const res = await request(app).get("/reports/sales-by-channel");

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        if (res.body.length > 0) {
        const row = res.body[0];
        expect(row).toHaveProperty("channel");
        expect(row).toHaveProperty("total_orders");
        expect(row).toHaveProperty("total_revenue");
        }
    });
});
