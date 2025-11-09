UPDATE inventory
SET quantity_on_hand = quantity_on_hand + 200;

-- Generate ~100 sales over the last ~60 days
DO $$
DECLARE
    v_customer_id      INTEGER;
    v_product_id       INTEGER;
    v_quantity         INTEGER;
    v_channel          VARCHAR(20);
    v_payment_method   VARCHAR(30);
    v_shipping_address TEXT;
    v_order_id         INTEGER;
    v_days_ago         INTEGER;
BEGIN
    FOR i IN 1..100 LOOP
    -- Pick a random customer
    SELECT id
    INTO v_customer_id
    FROM customers
    ORDER BY random()
    LIMIT 1;

    -- Pick a random product that has inventory
    SELECT p.id
    INTO v_product_id
    FROM products p
    JOIN inventory i ON i.product_id = p.id
    ORDER BY random()
    LIMIT 1;

    -- Random quantity between 1 and 3
    v_quantity := (1 + floor(random() * 3))::INT;

    -- Random channel: ~50% in_store, ~50% online
    IF random() < 0.5 THEN
        v_channel := 'in_store';
        v_payment_method := 'cash';
        v_shipping_address := NULL;
    ELSE
        v_channel := 'online';
        v_payment_method := 'credit_card';
        v_shipping_address := '123 Example St, Game City, GP 00000';
    END IF;

    -- Calls stored procedure to create the sale and update inventory
    v_order_id := sp_record_sale(
        v_customer_id,
        v_product_id,
        v_quantity,
        v_channel,
        v_payment_method,
        v_shipping_address
    );

    -- Spread orders across the last ~60 days
    v_days_ago := (floor(random() * 60))::INT;
    UPDATE sales_orders
    SET order_date = NOW() - (v_days_ago || ' days')::interval
    WHERE id = v_order_id;
    END LOOP;
END;
$$;
