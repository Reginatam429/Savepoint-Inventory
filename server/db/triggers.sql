DROP TRIGGER IF EXISTS trg_inventory_audit ON inventory;
DROP FUNCTION IF EXISTS fn_inventory_audit() CASCADE;

-- Trigger function: logs every change to inventory.quantity_on_hand
CREATE OR REPLACE FUNCTION fn_inventory_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only log when quantity_on_hand actually changes
    IF NEW.quantity_on_hand IS DISTINCT FROM OLD.quantity_on_hand THEN
        INSERT INTO inventory_audit (
        product_id,
        old_quantity,
        new_quantity,
        changed_at,
        reason
        )
        VALUES (
        NEW.product_id,
        OLD.quantity_on_hand,
        NEW.quantity_on_hand,
        CURRENT_TIMESTAMP,
        'auto: inventory change'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Attach the trigger to the inventory table
CREATE TRIGGER trg_inventory_audit
AFTER UPDATE OF quantity_on_hand
ON inventory
FOR EACH ROW
EXECUTE FUNCTION fn_inventory_audit();
