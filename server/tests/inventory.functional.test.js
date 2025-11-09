import request from "supertest";
import app from "../src/server.js";

describe("Inventory API (functional)", () => {
    test("GET /inventory/low-stock returns an array", async () => {
        const res = await request(app).get("/inventory/low-stock");
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("POST /inventory/receive validates required fields", async () => {
        const res = await request(app)
        .post("/inventory/receive")
        .send({
            // missing quantity on purpose
            product_id: 1,
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
    });
});
