import request from "supertest";
import app from "../src/server.js";
import { pool } from "../src/db.js";

describe("Sales API (integration)", () => {
    test("POST /sales creates an order and updates inventory + audit", async () => {
        const productId = 1;
        const customerId = 1;

        const beforeInv = await pool.query(
        "SELECT quantity_on_hand FROM inventory WHERE product_id = $1",
        [productId]
        );
        const beforeQty = beforeInv.rows[0].quantity_on_hand;

        const payload = {
        customer_id: customerId,
        product_id: productId,
        quantity: 1,
        channel: "in_store",
        payment_method: "cash",
        shipping_address: null,
        };

        const res = await request(app).post("/sales").send(payload);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("order_id");
        const orderId = res.body.order_id;

        // Check sales_orders
        const order = await pool.query(
        "SELECT * FROM sales_orders WHERE id = $1",
        [orderId]
        );
        expect(order.rowCount).toBe(1);
        expect(order.rows[0].customer_id).toBe(customerId);

        // Check inventory decreased
        const afterInv = await pool.query(
        "SELECT quantity_on_hand FROM inventory WHERE product_id = $1",
        [productId]
        );
        const afterQty = afterInv.rows[0].quantity_on_hand;
        expect(afterQty).toBe(beforeQty - 1);

        // Check audit log has at least one entry for this product
        const audit = await pool.query(
        "SELECT * FROM inventory_audit WHERE product_id = $1 ORDER BY changed_at DESC LIMIT 1",
        [productId]
        );
        expect(audit.rowCount).toBe(1);
        expect(audit.rows[0].old_quantity).toBe(beforeQty);
        expect(audit.rows[0].new_quantity).toBe(afterQty);
    });
});
