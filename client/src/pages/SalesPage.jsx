import { useEffect, useState } from "react";
import { api } from "../api";

const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    const num = Number(value);
    if (Number.isNaN(num)) return "—";
    return `$${num.toFixed(2)}`;
    };

    const SalesPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(25);
    const [pageIndex, setPageIndex] = useState(0);
    const [sortDirection, setSortDirection] = useState("desc");
    const [channelFilter, setChannelFilter] = useState("");

    // Add sale
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");


    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
    customer_id: "",
    product_id: "",
    quantity: 1,
    channel: "in_store",
    payment_method: "",
    });
    const [createError, setCreateError] = useState("");
    const [creating, setCreating] = useState(false);

    // modal state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        channel: "",
        payment_method: "",
        status: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const [salesRes, customersRes, productsRes] = await Promise.all([
                api.get("/sales"),
                api.get("/customers"),
                api.get("/products"),
                ]);
                setOrders(salesRes.data);
                setCustomers(customersRes.data);
                setProducts(productsRes.data);
            } catch (err) {
                console.error("Error loading sales", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // filter by channel
    const filteredOrders = channelFilter
    ? orders.filter((o) => o.channel === channelFilter)
    : orders;

    // sort by date
    const sortedOrders = [...filteredOrders].sort((a, b) => {
    const da = new Date(a.order_date);
    const db = new Date(b.order_date);
    return sortDirection === "asc" ? da - db : db - da;
    });

    // pagination on sorted/filtered list
    const totalPages = Math.ceil(sortedOrders.length / pageSize) || 1;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    const visibleOrders = sortedOrders.slice(startIndex, endIndex);

    const filteredCustomersForCreate =
        customerSearch.trim() === ""
            ? customers
            : customers.filter((c) =>
                `${c.name} ${c.email}`
                .toLowerCase()
                .includes(customerSearch.toLowerCase())
            );

    const filteredProductsForCreate =
        productSearch.trim() === ""
            ? products
            : products.filter((p) =>
                `${p.name} ${p.platform} ${p.edition}`
                .toLowerCase()
                .includes(productSearch.toLowerCase())
            );


    const openEditModal = (order) => {
        setSelectedOrder(order);
        setForm({
        channel: order.channel || "",
        payment_method: order.payment_method || "",
        status: order.status || "",
        });
        setError("");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!selectedOrder) return;
        setSaving(true);
        setError("");

        try {
        const id = selectedOrder.id ?? selectedOrder.order_id;
        const res = await api.put(`/sales/${id}`, {
            channel: form.channel || selectedOrder.channel,
            payment_method: form.payment_method || selectedOrder.payment_method,
            status: form.status || selectedOrder.status,
        });

        // optimistic update from response or form
        const updated = res.data || {
            ...selectedOrder,
            ...form,
        };

        setOrders((prev) =>
            prev.map((o) =>
            (o.id ?? o.order_id) === (id) ? { ...o, ...updated } : o
            )
        );

        closeModal();
        } catch (err) {
        console.error("Error updating sale", err);
        setError("Failed to update sale. Please try again.");
        } finally {
        setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedOrder) return;
        const confirmDelete = window.confirm(
        "Are you sure you want to delete this sale? This cannot be undone."
        );
        if (!confirmDelete) return;

        setSaving(true);
        setError("");

        try {
        const id = selectedOrder.id ?? selectedOrder.order_id;
        await api.delete(`/sales/${id}`);

        setOrders((prev) =>
            prev.filter((o) => (o.id ?? o.order_id) !== id)
        );

        closeModal();
        } catch (err) {
        console.error("Error deleting sale", err);
        setError("Failed to delete sale. Please try again.");
        setSaving(false);
        }
    };

    return (
        <div className="page">
        <div className="page-header">
            <div>
                <h1 className="page-title">Sales</h1>
                <p className="page-subtitle">
                Recent orders with channel, customer, and totals.
                </p>
            </div>

            <button
                className="btn-primary btn-pill"
                type="button"
                onClick={() => {
                setCreateForm({
                    customer_id: "",
                    product_id: "",
                    quantity: 1,
                    channel: "in_store",
                    payment_method: "",
                });
                setCustomerSearch("");
                setProductSearch("");
                setCreateError("");
                setIsCreateModalOpen(true);
                }}
            >
                + New sale
            </button>
            </div>

            <div className="page-filters">
                <div className="page-filters-left">
                    <div className="filter-group-inline">
                    <span className="filter-label-inline">Sort by date:</span>
                    <select
                        className="filter-select-inline"
                        value={sortDirection}
                        onChange={(e) => {
                        setSortDirection(e.target.value);
                        setPageIndex(0);
                        }}
                    >
                        <option value="desc">Newest first</option>
                        <option value="asc">Oldest first</option>
                    </select>
                    </div>

                    <div className="filter-group-inline">
                    <span className="filter-label-inline">Channel:</span>
                    <select
                        className="filter-select-inline"
                        value={channelFilter}
                        onChange={(e) => {
                        setChannelFilter(e.target.value);
                        setPageIndex(0);
                        }}
                    >
                        <option value="">All channels</option>
                        <option value="in_store">In-store</option>
                        <option value="online">Online</option>
                    </select>
                </div>
            </div>

            <div className="page-filters-right">
                <div className="filter-group-inline">
                <span className="filter-label-inline">Rows:</span>
                <select
                    className="filter-select-inline"
                    value={pageSize}
                    onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageIndex(0);
                    }}
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
                </div>
            </div>
            </div>

        {loading ? (
            <div className="loading">Loading sales...</div>
        ) : (
            <div className="card">
            <div className="table-wrapper table-scroll">
                <table className="table">
                <thead>
                    <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Channel</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                    {visibleOrders.map((o) => {
                    const id = o.id ?? o.order_id;
                    return (
                        <tr key={id}>
                        <td>{id}</td>
                        <td>
                            {o.order_date
                            ? new Date(o.order_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>{o.channel}</td>
                        <td>{o.customer_name || "Guest"}</td>
                        <td>{formatCurrency(o.total_amount)}</td>
                        <td className="table-actions-cell">
                            <button
                            className="btn-link"
                            onClick={() => openEditModal(o)}
                            >
                            Edit
                            </button>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
                {orders.length > 0 && (
                    <div className="table-footer">
                        <span>
                        Showing {sortedOrders.length === 0 ? 0 : startIndex + 1}–{startIndex + visibleOrders.length} of {sortedOrders.length} orders
                        </span>
                        <div className="table-footer-actions">
                        <button
                            className="btn-secondary btn-pill"
                            type="button"
                            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                            disabled={pageIndex === 0}
                        >
                            Previous
                        </button>
                        <button
                            className="btn-secondary btn-pill"
                            type="button"
                            onClick={() =>
                            setPageIndex((p) =>
                                p + 1 < totalPages ? p + 1 : p
                            )
                            }
                            disabled={pageIndex + 1 >= totalPages}
                        >
                            Next
                        </button>
                        </div>
                    </div>
                )}

            </div>
        )}

        {isCreateModalOpen && (
        <div
            className="modal-backdrop"
            onClick={() => setIsCreateModalOpen(false)}
        >
            <div
            className="modal"
            onClick={(e) => {
                e.stopPropagation();
            }}
            >
            <h2 className="modal-title">New Sale</h2>
            <p className="modal-subtitle">
                Record a new order and automatically update inventory.
            </p>

            <div className="modal-body">
            <div className="form-field">
                <label htmlFor="customer_id">Customer</label>
                <input
                    id="customerSearch"
                    type="text"
                    placeholder="Search by name or email (blank = Guest)"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                />
                <select
                    id="customer_id"
                    name="customer_id"
                    value={createForm.customer_id}
                    onChange={(e) =>
                    setCreateForm((prev) => ({
                        ...prev,
                        customer_id: e.target.value,
                    }))
                    }
                >
                    <option value="">Guest (no account)</option>
                    {filteredCustomersForCreate.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                    </option>
                    ))}
                </select>
            </div>

            <div className="form-field">
            <label htmlFor="product_id">Product</label>
            <input
                id="productSearch"
                type="text"
                placeholder="Search games by name or platform"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
            />
            <select
                id="product_id"
                name="product_id"
                value={createForm.product_id}
                onChange={(e) =>
                setCreateForm((prev) => ({
                    ...prev,
                    product_id: e.target.value,
                }))
                }
            >
                <option value="">Select a game</option>
                {filteredProductsForCreate.map((p) => (
                <option key={p.id} value={p.id}>
                    {p.name} – {p.platform} ({p.edition})
                </option>
                ))}
            </select>
            </div>

                <div className="form-field">
                <label htmlFor="quantity">Quantity</label>
                <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={createForm.quantity}
                    onChange={(e) =>
                    setCreateForm((prev) => ({
                        ...prev,
                        quantity: Number(e.target.value),
                    }))
                    }
                />
                </div>

                <div className="form-field">
                <label htmlFor="channel">Channel</label>
                <select
                    id="channel"
                    name="channel"
                    value={createForm.channel}
                    onChange={(e) =>
                    setCreateForm((prev) => ({
                        ...prev,
                        channel: e.target.value,
                    }))
                    }
                >
                    <option value="in_store">In-store</option>
                    <option value="online">Online</option>
                </select>
                </div>

                <div className="form-field">
                <label htmlFor="payment_method">Payment Method</label>
                <select
                    id="payment_method"
                    name="payment_method"
                    value={createForm.payment_method}
                    onChange={(e) =>
                    setCreateForm((prev) => ({
                        ...prev,
                        payment_method: e.target.value,
                    }))
                    }
                >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit card</option>
                    <option value="debit_card">Debit card</option>
                    <option value="paypal">PayPal</option>
                </select>
                </div>

                {createError && <p className="form-error">{createError}</p>}
            </div>

            <div className="modal-footer">
                <button
                className="btn-secondary"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={creating}
                >
                Cancel
                </button>
                <button
                className="btn-primary"
                type="button"
                onClick={async () => {
                    if (!createForm.product_id || !createForm.quantity) {
                    setCreateError("Product and quantity are required.");
                    return;
                    }

                    setCreating(true);
                    setCreateError("");

                    try {
                    const payload = {
                        customer_id: createForm.customer_id || null,
                        product_id: Number(createForm.product_id),
                        quantity: createForm.quantity,
                        channel: createForm.channel,
                        payment_method: createForm.payment_method || null,
                    };

                    await api.post("/sales", payload);
                    const refresh = await api.post("/sales", payload);

                    setOrders(refresh.data);
                    setPageIndex(0);

                    setIsCreateModalOpen(false);
                    } catch (err) {
                    console.error("Error creating sale", err);
                    setCreateError("Failed to create sale. Please try again.");
                    } finally {
                    setCreating(false);
                    }
                }}
                disabled={creating}
                >
                {creating ? "Saving..." : "Create sale"}
                </button>
            </div>
            </div>
        </div>
        )}

        {isModalOpen && selectedOrder && (
            <div className="modal-backdrop" onClick={closeModal}>
            <div
                className="modal"
                onClick={(e) => {
                e.stopPropagation();
                }}
            >
                <h2 className="modal-title">
                Edit Sale #{selectedOrder.id ?? selectedOrder.order_id}
                </h2>
                <p className="modal-subtitle">
                Update basic details or delete this sale.
                </p>

                <div className="modal-body">
                <div className="form-field">
                    <label htmlFor="channel">Channel</label>
                    <select
                    id="channel"
                    name="channel"
                    value={form.channel}
                    onChange={handleFormChange}
                    >
                    <option value="">Select channel</option>
                    <option value="in_store">In-store</option>
                    <option value="online">Online</option>
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="payment_method">Payment Method</label>
                    <input
                    id="payment_method"
                    name="payment_method"
                    type="text"
                    value={form.payment_method}
                    onChange={handleFormChange}
                    placeholder="e.g. credit_card, cash, paypal"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="status">Status</label>
                    <input
                    id="status"
                    name="status"
                    type="text"
                    value={form.status}
                    onChange={handleFormChange}
                    placeholder="e.g. completed, pending, cancelled"
                    />
                </div>

                {error && <p className="form-error">{error}</p>}
                </div>

                <div className="modal-footer">
                <button
                    className="btn-secondary"
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    className="btn-danger"
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                >
                    Delete
                </button>
                <button
                    className="btn-primary"
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save changes"}
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
};

export default SalesPage;
