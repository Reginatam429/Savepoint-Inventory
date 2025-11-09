DROP FUNCTION IF EXISTS sp_record_sale(
    INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR, TEXT
) CASCADE;

DROP FUNCTION IF EXISTS sp_receive_stock(
    INTEGER, INTEGER
) CASCADE;

-- sp_record_sale
-- Records a single-product sale, inserts into sales_orders and sales_order_items,
-- and decrements inventory.quantity_on_hand for the given product.
-- Returns the created sales_orders.id (order_id).
CREATE OR REPLACE FUNCTION sp_record_sale(
    p_customer_id     INTEGER,
    p_product_id      INTEGER,
    p_quantity        INTEGER,
    p_channel         VARCHAR DEFAULT 'in_store',
    p_payment_method  VARCHAR DEFAULT NULL,
    p_shipping_address TEXT   DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id       INTEGER;
    v_unit_price     DECIMAL(10,2);
    v_current_stock  INTEGER;
BEGIN
    IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    -- Lock the inventory row so concurrent updates don't race
    SELECT quantity_on_hand
    INTO v_current_stock
    FROM inventory
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No inventory row found for product_id=%', p_product_id;
    END IF;

    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product_id=%. Available=%, requested=%',
        p_product_id, v_current_stock, p_quantity;
    END IF;

    -- Get current unit price from products
    SELECT base_price
    INTO v_unit_price
    FROM products
    WHERE id = p_product_id;

    IF v_unit_price IS NULL THEN
        RAISE EXCEPTION 'No base_price found for product_id=%', p_product_id;
    END IF;

    -- Insert the sales order
    INSERT INTO sales_orders (
        customer_id,
        channel,
        payment_method,
        shipping_address,
        delivery_status,
        status
    )
    VALUES (
        p_customer_id,
        p_channel,
        p_payment_method,
        p_shipping_address,
        CASE WHEN p_channel = 'online' THEN 'Pending' ELSE 'N/A' END,
        'completed'
    )
    RETURNING id INTO v_order_id;

    -- Insert the single line item
    INSERT INTO sales_order_items (
        order_id,
        product_id,
        quantity,
        unit_price
    )
    VALUES (
        v_order_id,
        p_product_id,
        p_quantity,
        v_unit_price
    );

    -- Decrease inventory
    UPDATE inventory
    SET
        quantity_on_hand = quantity_on_hand - p_quantity,
        updated_at       = CURRENT_TIMESTAMP
    WHERE product_id = p_product_id;

    -- Trigger will log the inventory change in inventory_audit
    RETURN v_order_id;
END;
$$;


-- sp_receive_stock
-- Increases inventory for a given product when new stock is received.
CREATE OR REPLACE FUNCTION sp_receive_stock(
    p_product_id INTEGER,
    p_quantity   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_exists INTEGER;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    SELECT COUNT(*) INTO v_exists
    FROM inventory
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF v_exists = 0 THEN
        RAISE EXCEPTION 'No inventory row found for product_id=%', p_product_id;
    END IF;

    UPDATE inventory
    SET
        quantity_on_hand = quantity_on_hand + p_quantity,
        updated_at       = CURRENT_TIMESTAMP
    WHERE product_id = p_product_id;

    -- Trigger will log the inventory change automatically
END;
$$;
