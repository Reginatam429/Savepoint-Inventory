```text
███████╗ █████╗ ██╗   ██╗███████╗██████╗  ██████╗ ██╗███╗   ██╗████████╗
██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗██╔═══██║██║████╗  ██║╚══██╔══╝
███████╗███████║██║   ██║█████╗  ██████╔╝██║   ██║██║██╔██╗ ██║   ██║   
╚════██║██╔══██║╚██╗ ██╔╝██╔══╝  ██╔═══╝ ██║   ██║██║██║╚██╗██║   ██║   
███████║██║  ██║ ╚████╔╝ ███████╗██║     ╚██████╔╝██║██║ ╚████║   ██║   
╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝      ╚═════╝ ╚═╝╚═╝  ╚═══╝   ╚═╝   
```
🎮 SAVEPOINT INVENTORY | SQL + Node.js Inventory Management System

## Data Model and User Stories

Data Model:

![Data Model](/assets/savepoint-datamodel.png)

<details>
  <summary>🖱️ Click to view SQL table definitions</summary>

```sql
Table suppliers {
  id              int         [pk, increment]
  name            varchar(100) [not null]
  contact_email   varchar(100)
  contact_phone   varchar(20)
  created_at      timestamp   [default: `now()`]
  Note: 'Suppliers who provide physical or digital games.'
}

Table products {
  id              int          [pk, increment]
  name            varchar(100) [not null]
  platform        varchar(50)  // e.g. PS5, Switch, PC
  edition         varchar(50)  // e.g. Standard, Deluxe
  genre           varchar(50)
  base_price      decimal(10,2)
  is_physical     boolean      [default: true]
  is_digital      boolean      [default: false]
  supplier_id     int          [not null, ref: > suppliers.id]
  created_at      timestamp    [default: `now()`]
  Note: 'Video game products sold by the store.'
}

Table inventory {
  id               int        [pk, increment]
  product_id       int        [not null, unique, ref: > products.id]
  quantity_on_hand int        [not null, default: 0]
  reorder_level    int        [not null, default: 5]
  updated_at       timestamp  [default: `now()`]
  Note: 'Current stock level per product for the single store location.'
}

Table customers {
  id            int          [pk, increment]
  name          varchar(100)
  email         varchar(100)
  created_at    timestamp    [default: `now()`]
  Note: 'Customers for associating sales.'
}

Table sales_orders {
  id              int          [pk, increment]
  order_date      timestamp    [default: `now()`]
  customer_id     int          [ref: > customers.id] // nullable for guest sales
  channel         varchar(20)  [default: 'in_store'] // in_store, online
  payment_method  varchar(30)  // cash, credit_card, paypal, etc.
  shipping_address text        // mainly for online orders
  delivery_status varchar(30)  [default: 'N/A'] // Pending, Shipped, Delivered, etc.
  status          varchar(20)  [default: 'completed'] // completed, pending, cancelled
  created_at      timestamp    [default: `now()`]
  Note: 'Top-level sales orders, including online vs in-store channel info.'
}

Table sales_order_items {
  id          int           [pk, increment]
  order_id    int           [not null, ref: > sales_orders.id]
  product_id  int           [not null, ref: > products.id]
  quantity    int           [not null]
  unit_price  decimal(10,2) [not null]
  Note: 'Line items for each sales order.'
}

Table inventory_audit {
  id            int        [pk, increment]
  product_id    int        [ref: > products.id]
  old_quantity  int
  new_quantity  int
  changed_at    timestamp  [default: `now()`]
  reason        text       // e.g. 'auto: sale', 'auto: receive_stock', 'manual adjustment'
  Note: 'Audit log populated by trigger whenever inventory.quantity_on_hand changes.'
}
```
</details> 

---
<br></br>

# 🏪 Dashboard & Reporting

 - View overall sales, revenue, and inventory status on a single dashboard.

 - Filter best-selling products by date range or sales channel (in-store vs. online).

 - Compare total revenue between online and in-store sales.

 - See low-stock products that need restocking.

 - Review inventory change logs via the audit table.

🎮 Products Management

 - List all products with supplier, price, platform, and current quantity.

 - Add new products to track new game releases.

 - Edit product details (price, supplier, platform).

 - Delete or deactivate discontinued products.

📦 Suppliers Management

 - View and manage all suppliers and their contact info.

 - Add, edit, or remove supplier records as partnerships change.

👥 Customers Management

 - View all customers and their loyalty tiers.

 - Add, update, or delete customer records.

 - Associate each sale with a customer (or guest).

💰 Sales Management

 - Record in-store and online sales with customer, product, and quantity info.

 - Include payment method, shipping address, and delivery status for online sales.

 - View and filter sales by date, customer, product, or channel.

 - See sale details including total order value and line items.

⚙️ Inventory Logic & Integrity

 - Inventory automatically decreases when a sale is recorded.

 - Restocks handled through a stored procedure (sp_receive_stock).

 - Every stock change is logged by an AFTER UPDATE trigger in inventory_audit.

 - Reorder thresholds (reorder_level) flag low-stock alerts.

📈 Analytical Reports

 - View top-selling products and total revenue over time.

 - Identify slow-moving or unsold products.

 - Compare revenue by channel (online vs. in-store).

 - Evaluate supplier performance through joined sales data.

# Implementation Notes:
- Design Process:
    - Exercise: Custom version of Retail Inventory System
    - Theme: Video game store admin tool
    - Name: SavePoint Inventory
- Data Model Plan:
    - Decided to add online sales as a second sales channel to make the system more realistic.
    - Added a 'channel' column to sales_orders and updated stored procedures and reports accordingly
## Learnings
- I learned how to encapsulate business logic inside the database layer by writing SQL functions such as sp_record_sale and sp_receive_stock. These functions allow me to perform multiple steps (insert order, insert order items, update inventory) in a single transactional call, enforcing rules (e.g., quantity must be >0, sufficient stock) and returning a meaningful result (order ID).PostgreSQL Docs: Functions → https://www.postgresql.org/docs/current/functions.html

- I learned how to configure a trigger on table changes (specifically an AFTER UPDATE trigger on inventory.quantity_on_hand) that automatically logs all stock-level changes into an audit table (inventory_audit). This moves the logging responsibility out of application code and into the database itself. PostgreSQL Docs: Triggers → https://www.postgresql.org/docs/current/triggers.html

# Future Development/ Wishlist
- Add loyalty tier to customers to allow filtering by loyalty and tracking frequent customers - Bronze, Silver, Gold, etc.
- Add in preorders for filtering and tracking for when the game is released