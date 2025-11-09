-- Drop tables if they exist
DROP TABLE IF EXISTS inventory_audit CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Suppliers who provide physical or digital games
CREATE TABLE suppliers (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video game products sold by the store
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    platform    VARCHAR(50),     -- e.g. PS5, Switch, PC
    edition     VARCHAR(50),     -- e.g. Standard, Deluxe
    genre       VARCHAR(50),
    base_price  DECIMAL(10,2),
    is_physical BOOLEAN DEFAULT TRUE,
    is_digital  BOOLEAN DEFAULT FALSE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current stock level per product (single store location)
CREATE TABLE inventory (
    id               SERIAL PRIMARY KEY,
    product_id       INTEGER NOT NULL UNIQUE REFERENCES products(id),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    reorder_level    INTEGER NOT NULL DEFAULT 5,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers for associating sales
CREATE TABLE customers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100),
    email      VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Top-level sales orders, including online vs in-store channel info
CREATE TABLE sales_orders (
    id              SERIAL PRIMARY KEY,
    order_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id     INTEGER REFERENCES customers(id), -- nullable for guest sales
    channel         VARCHAR(20) NOT NULL DEFAULT 'in_store', -- in_store, online
    payment_method  VARCHAR(30), -- cash, credit_card, paypal, etc.
    shipping_address TEXT,       -- mainly for online orders
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'N/A',      -- Pending, Shipped...
    status          VARCHAR(20) NOT NULL DEFAULT 'completed',-- completed, cancelled
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT channel_valid CHECK (channel IN ('in_store', 'online'))
);

-- Line items for each sales order
CREATE TABLE sales_order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Audit log populated by trigger whenever inventory.quantity_on_hand changes
CREATE TABLE inventory_audit (
    id           SERIAL PRIMARY KEY,
    product_id   INTEGER REFERENCES products(id),
    old_quantity INTEGER,
    new_quantity INTEGER,
    changed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason       TEXT
);
