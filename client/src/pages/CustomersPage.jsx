import { useEffect, useState } from "react";
import { api } from "../api";

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // table controls
    const [pageSize, setPageSize] = useState(25);
    const [pageIndex, setPageIndex] = useState(0);
    const [sortDirection, setSortDirection] = useState("desc"); // newest first

    // create modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: "",
        email: "",
    });
    const [createError, setCreateError] = useState("");
    const [creating, setCreating] = useState(false);

    // edit modal
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
    });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");

    useEffect(() => {
        const load = async () => {
        try {
            const res = await api.get("/customers");
            setCustomers(res.data);
        } catch (err) {
            console.error("Error loading customers", err);
        } finally {
            setLoading(false);
        }
        };
        load();
    }, []);

    // sort by joined date
    const sortedCustomers = [...customers].sort((a, b) => {
        const da = new Date(a.created_at);
        const db = new Date(b.created_at);
        return sortDirection === "asc" ? da - db : db - da;
    });

    // pagination
    const totalPages = Math.ceil(sortedCustomers.length / pageSize) || 1;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    const visibleCustomers = sortedCustomers.slice(startIndex, endIndex);

    const openCreateModal = () => {
        setCreateForm({ name: "", email: "" });
        setCreateError("");
        setIsCreateModalOpen(true);
    };

    const openEditModal = (customer) => {
        setSelectedCustomer(customer);
        setEditForm({
        name: customer.name || "",
        email: customer.email || "",
        });
        setEditError("");
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedCustomer(null);
    };

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const refreshCustomers = async () => {
        const res = await api.get("/customers");
        setCustomers(res.data);
    };

    const handleCreate = async () => {
        if (!createForm.name.trim() || !createForm.email.trim()) {
        setCreateError("Name and email are required.");
        return;
        }

        setCreating(true);
        setCreateError("");

        try {
        await api.post("/customers", {
            name: createForm.name.trim(),
            email: createForm.email.trim(),
        });

        await refreshCustomers();
        setPageIndex(0);
        setIsCreateModalOpen(false);
        } catch (err) {
        console.error("Error creating customer", err);
        setCreateError("Failed to create customer. Please try again.");
        } finally {
        setCreating(false);
        }
    };

    const handleSave = async () => {
        if (!selectedCustomer) return;
        if (!editForm.name.trim() || !editForm.email.trim()) {
        setEditError("Name and email are required.");
        return;
        }

        setSaving(true);
        setEditError("");

        try {
        await api.put(`/customers/${selectedCustomer.id}`, {
            name: editForm.name.trim(),
            email: editForm.email.trim(),
        });

        await refreshCustomers();
        closeEditModal();
        } catch (err) {
        console.error("Error updating customer", err);
        setEditError("Failed to update customer. Please try again.");
        } finally {
        setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCustomer) return;
        const confirmDelete = window.confirm(
        "Delete this customer? Their historical sales will remain."
        );
        if (!confirmDelete) return;

        setSaving(true);
        setEditError("");

        try {
        await api.delete(`/customers/${selectedCustomer.id}`);
        await refreshCustomers();
        closeEditModal();
        } catch (err) {
        console.error("Error deleting customer", err);
        setEditError("Failed to delete customer. Please try again.");
        setSaving(false);
        }
    };

    return (
        <div className="page">
        <div className="page-header">
            <div>
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">
                Saved customers associated with in-store and online orders.
            </p>
            </div>

            <button
            className="btn-primary btn-pill"
            type="button"
            onClick={openCreateModal}
            >
            + New customer
            </button>
        </div>

        <div className="page-filters">
            <div className="page-filters-left">
                <div className="filter-group-inline">
                <span className="filter-label-inline">Sort by joined date:</span>
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
            <div className="loading">Loading customers...</div>
        ) : (
            <div className="card">
            <div className="table-wrapper table-scroll">
                <table className="table">
                <thead>
                    <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                    {visibleCustomers.map((c) => (
                    <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td>
                        {c.created_at
                            ? new Date(c.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="table-actions-cell">
                        <button
                            className="btn-link"
                            type="button"
                            onClick={() => openEditModal(c)}
                        >
                            Edit
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {sortedCustomers.length > 0 && (
                <div className="table-footer">
                <span>
                    Showing{" "}
                    {sortedCustomers.length === 0 ? 0 : startIndex + 1}–
                    {startIndex + visibleCustomers.length} of{" "}
                    {sortedCustomers.length} customers
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

        {/* Create customer modal */}
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
                <h2 className="modal-title">New customer</h2>
                <p className="modal-subtitle">
                Add a customer so you can tie future orders to their profile.
                </p>

                <div className="modal-body">
                <div className="form-field">
                    <label htmlFor="new-name">Name</label>
                    <input
                    id="new-name"
                    name="name"
                    type="text"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    placeholder="Customer name"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="new-email">Email</label>
                    <input
                    id="new-email"
                    name="email"
                    type="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    placeholder="email@example.com"
                    />
                </div>

                {createError && (
                    <p className="form-error">{createError}</p>
                )}
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
                    onClick={handleCreate}
                    disabled={creating}
                >
                    {creating ? "Saving..." : "Create customer"}
                </button>
                </div>
            </div>
            </div>
        )}

        {/* Edit customer modal */}
        {isEditModalOpen && selectedCustomer && (
            <div className="modal-backdrop" onClick={closeEditModal}>
            <div
                className="modal"
                onClick={(e) => {
                e.stopPropagation();
                }}
            >
                <h2 className="modal-title">
                Edit customer – {selectedCustomer.name}
                </h2>
                <p className="modal-subtitle">
                Update basic details or remove this customer.
                </p>

                <div className="modal-body">
                <div className="form-field">
                    <label htmlFor="edit-name">Name</label>
                    <input
                    id="edit-name"
                    name="name"
                    type="text"
                    value={editForm.name}
                    onChange={handleEditChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="edit-email">Email</label>
                    <input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    />
                </div>

                {editError && (
                    <p className="form-error">{editError}</p>
                )}
                </div>

                <div className="modal-footer">
                <button
                    className="btn-secondary"
                    type="button"
                    onClick={closeEditModal}
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

export default CustomersPage;
