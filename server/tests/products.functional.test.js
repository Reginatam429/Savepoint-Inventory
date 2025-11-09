import request from "supertest";
import app from "../src/server.js";

describe("Products API (functional)", () => {
    test("GET /products returns a list of products", async () => {
        const res = await request(app).get("/products");
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        const product = res.body[0];
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("platform");
    });

    test("POST /products validates required fields", async () => {
        const res = await request(app)
        .post("/products")
        .send({
            // missing name + supplier_id on purpose
            platform: "Switch",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
    });
});
