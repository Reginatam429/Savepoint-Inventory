import { useEffect, useState } from "react";
import { api } from "../api";

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    // table controls
    const [pageSize, setPageSize] = useState(25);
    const [pageIndex, setPageIndex] = useState(0);

    // filters
    const [platformFilter, setPlatformFilter] = useState("");
    const [editionFilter, setEditionFilter] = useState("");
    const [genreFilter, setGenreFilter] = useState("");
    const [stockFilter, setStockFilter] = useState(""); // all / in_stock / low_stock / out_of_stock

    // create modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: "",
        platform: "",
        edition: "",
        genre: "",
        base_price: "",
        supplier_id: "",
        is_physical: true,
        is_digital: false,
        quantity_on_hand: 0,
        reorder_level: 5,
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // edit modal
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        platform: "",
        edition: "",
        genre: "",
        base_price: "",
        supplier_id: "",
        is_physical: true,
        is_digital: false,
    });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");

    useEffect(() => {
        const load = async () => {
        try {
            const [productsRes, suppliersRes] = await Promise.all([
            api.get("/products"),
            api.get("/suppliers"),
            ]);
            setProducts(productsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            console.error("Error loading products/suppliers", err);
        } finally {
            setLoading(false);
        }
        };
        load();
    }, []);

    const refreshProducts = async () => {
        const res = await api.get("/products");
        setProducts(res.data);
    };

    // filter options from data
    const platformOptions = Array.from(
        new Set(products.map((p) => p.platform).filter(Boolean))
    ).sort();

    const editionOptions = Array.from(
        new Set(products.map((p) => p.edition).filter(Boolean))
    ).sort();

    const genreOptions = Array.from(
        new Set(products.map((p) => p.genre).filter(Boolean))
    ).sort();

    // apply filters
    const filteredProducts = products.filter((p) => {
        const qty = p.quantity_on_hand ?? 0;

        if (platformFilter && p.platform !== platformFilter) return false;
        if (editionFilter && p.edition !== editionFilter) return false;
        if (genreFilter && p.genre !== genreFilter) return false;

        if (stockFilter === "in_stock" && !(qty > 0)) return false;
        if (stockFilter === "out_of_stock" && qty > 0) return false;
        if (stockFilter === "low_stock" && !(qty > 0 && qty <= 5)) return false;

        return true;
    });

    // pagination
    const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    const visibleProducts = filteredProducts.slice(startIndex, endIndex);

    // ---- Create modal handlers ----
    const openCreateModal = () => {
        setCreateForm({
        name: "",
        platform: "",
        edition: "",
        genre: "",
        base_price: "",
        supplier_id: "",
        is_physical: true,
        is_digital: false,
        quantity_on_hand: 0,
        reorder_level: 5,
        });
        setCreateError("");
        setIsCreateModalOpen(true);
    };

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateCheckbox = (e) => {
        const { name, checked } = e.target;
        setCreateForm((prev) => ({ ...prev, [name]: checked }));
    };

    const handleCreateSave = async () => {
        if (!createForm.name.trim() || !createForm.supplier_id) {
        setCreateError("Name and supplier are required.");
        return;
        }

        setCreating(true);
        setCreateError("");

        try {
        const payload = {
            name: createForm.name.trim(),
            platform: createForm.platform || null,
            edition: createForm.edition || null,
            genre: createForm.genre || null,
            base_price:
            createForm.base_price !== ""
                ? Number(createForm.base_price)
                : null,
            is_physical: !!createForm.is_physical,
            is_digital: !!createForm.is_digital,
            supplier_id: Number(createForm.supplier_id),
            quantity_on_hand: Number(createForm.quantity_on_hand) || 0,
            reorder_level: Number(createForm.reorder_level) || 5,
        };

        await api.post("/products", payload);
        await refreshProducts();
        setPageIndex(0);
        setIsCreateModalOpen(false);
        } catch (err) {
        console.error("Error creating product", err);
        setCreateError("Failed to create product. Please try again.");
        } finally {
        setCreating(false);
        }
    };

    // ---- Edit modal handlers ----
    const openEditModal = (product) => {
        setSelectedProduct(product);
        setEditForm({
        name: product.name || "",
        platform: product.platform || "",
        edition: product.edition || "",
        genre: product.genre || "",
        base_price:
            product.base_price != null ? String(product.base_price) : "",
        supplier_id: product.supplier_id ? String(product.supplier_id) : "",
        is_physical: !!product.is_physical,
        is_digital: !!product.is_digital,
        });
        setEditError("");
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedProduct(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditCheckbox = (e) => {
        const { name, checked } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: checked }));
    };

    const handleEditSave = async () => {
        if (!selectedProduct) return;
        if (!editForm.name.trim() || !editForm.supplier_id) {
        setEditError("Name and supplier are required.");
        return;
        }

        setSaving(true);
        setEditError("");

        try {
        const payload = {
            name: editForm.name.trim(),
            platform: editForm.platform || null,
            edition: editForm.edition || null,
            genre: editForm.genre || null,
            base_price:
            editForm.base_price !== ""
                ? Number(editForm.base_price)
                : null,
            is_physical: !!editForm.is_physical,
            is_digital: !!editForm.is_digital,
            supplier_id: Number(editForm.supplier_id),
        };

        await api.put(`/products/${selectedProduct.id}`, payload);
        await refreshProducts();
        closeEditModal();
        } catch (err) {
        console.error("Error updating product", err);
        setEditError("Failed to update product. Please try again.");
        } finally {
        setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        const confirmDelete = window.confirm(
        "Delete this product and its inventory row? This cannot be undone."
        );
        if (!confirmDelete) return;

        setSaving(true);
        setEditError("");

        try {
        await api.delete(`/products/${selectedProduct.id}`);
        await refreshProducts();
        closeEditModal();
        } catch (err) {
        console.error("Error deleting product", err);
        setEditError("Failed to delete product. Please try again.");
        setSaving(false);
        }
    };

    return (
        <div className="page">
        <div className="page-header">
            <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">
                View and manage games currently tracked in SavePoint inventory.
            </p>
            </div>

            <button
            className="btn-primary btn-pill"
            type="button"
            onClick={openCreateModal}
            >
            + New product
            </button>
        </div>

        <div className="page-filters">
            <div className="page-filters-left">
            <div className="filter-group-inline">
                <span className="filter-label-inline">Platform:</span>
                <select
                className="filter-select-inline"
                value={platformFilter}
                onChange={(e) => {
                    setPlatformFilter(e.target.value);
                    setPageIndex(0);
                }}
                >
                <option value="">All platforms</option>
                {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                    {platform}
                    </option>
                ))}
                </select>
            </div>

            <div className="filter-group-inline">
                <span className="filter-label-inline">Edition:</span>
                <select
                className="filter-select-inline"
                value={editionFilter}
                onChange={(e) => {
                    setEditionFilter(e.target.value);
                    setPageIndex(0);
                }}
                >
                <option value="">All editions</option>
                {editionOptions.map((edition) => (
                    <option key={edition} value={edition}>
                    {edition}
                    </option>
                ))}
                </select>
            </div>

            <div className="filter-group-inline">
                <span className="filter-label-inline">Genre:</span>
                <select
                className="filter-select-inline"
                value={genreFilter}
                onChange={(e) => {
                    setGenreFilter(e.target.value);
                    setPageIndex(0);
                }}
                >
                <option value="">All genres</option>
                {genreOptions.map((genre) => (
                    <option key={genre} value={genre}>
                    {genre}
                    </option>
                ))}
                </select>
            </div>

            <div className="filter-group-inline">
                <span className="filter-label-inline">Stock:</span>
                <select
                className="filter-select-inline"
                value={stockFilter}
                onChange={(e) => {
                    setStockFilter(e.target.value);
                    setPageIndex(0);
                }}
                >
                <option value="">All</option>
                <option value="in_stock">In stock (&gt; 0)</option>
                <option value="low_stock">Low stock (1–5)</option>
                <option value="out_of_stock">Out of stock (0)</option>
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
            <div className="loading">Loading products...</div>
        ) : (
            <div className="card">
            <div className="table-wrapper table-scroll">
                <table className="table">
                <thead>
                    <tr>
                    <th>Name</th>
                    <th>Platform</th>
                    <th>Edition</th>
                    <th>Genre</th>
                    <th>Supplier</th>
                    <th>Base Price</th>
                    <th>On Hand</th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                    {visibleProducts.map((p) => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.platform}</td>
                        <td>{p.edition}</td>
                        <td>{p.genre}</td>
                        <td>{p.supplier_name}</td>
                        <td>
                        {p.base_price != null
                            ? `$${Number(p.base_price).toFixed(2)}`
                            : "—"}
                        </td>
                        <td>{p.quantity_on_hand ?? "—"}</td>
                        <td className="table-actions-cell">
                        <button
                            className="btn-link"
                            type="button"
                            onClick={() => openEditModal(p)}
                        >
                            Edit
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {filteredProducts.length > 0 && (
                <div className="table-footer">
                <span>
                    Showing{" "}
                    {filteredProducts.length === 0 ? 0 : startIndex + 1}–
                    {startIndex + visibleProducts.length} of{" "}
                    {filteredProducts.length} products
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

        {/* Create product modal */}
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
                <h2 className="modal-title">New product</h2>
                <p className="modal-subtitle">
                Add a video game and its initial inventory level.
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
                    placeholder="Game title"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="new-platform">Platform</label>
                    <input
                    id="new-platform"
                    name="platform"
                    type="text"
                    value={createForm.platform}
                    onChange={handleCreateChange}
                    placeholder="e.g. PS5, Switch, PC"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="new-edition">Edition</label>
                    <input
                    id="new-edition"
                    name="edition"
                    type="text"
                    value={createForm.edition}
                    onChange={handleCreateChange}
                    placeholder="Standard, Deluxe, etc."
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="new-genre">Genre</label>
                    <input
                    id="new-genre"
                    name="genre"
                    type="text"
                    value={createForm.genre}
                    onChange={handleCreateChange}
                    placeholder="Action, RPG, Simulation..."
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="new-base-price">Base price</label>
                    <input
                    id="new-base-price"
                    name="base_price"
                    type="number"
                    step="0.01"
                    value={createForm.base_price}
                    onChange={handleCreateChange}
                    placeholder="69.99"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="new-supplier">Supplier</label>
                    <select
                    id="new-supplier"
                    name="supplier_id"
                    value={createForm.supplier_id}
                    onChange={handleCreateChange}
                    >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                        {s.name}
                        </option>
                    ))}
                    </select>
                </div>

                <div className="form-field form-field-inline">
                    <label>Availability</label>
                    <div className="checkbox-row">
                    <label>
                        <input
                        type="checkbox"
                        name="is_physical"
                        checked={createForm.is_physical}
                        onChange={handleCreateCheckbox}
                        />
                        Physical
                    </label>
                    <label>
                        <input
                        type="checkbox"
                        name="is_digital"
                        checked={createForm.is_digital}
                        onChange={handleCreateCheckbox}
                        />
                        Digital
                    </label>
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="new-quantity">Quantity on hand</label>
                    <input
                    id="new-quantity"
                    name="quantity_on_hand"
                    type="number"
                    min="0"
                    value={createForm.quantity_on_hand}
                    onChange={handleCreateChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="new-reorder">Reorder level</label>
                    <input
                    id="new-reorder"
                    name="reorder_level"
                    type="number"
                    min="0"
                    value={createForm.reorder_level}
                    onChange={handleCreateChange}
                    />
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
                    onClick={handleCreateSave}
                    disabled={creating}
                >
                    {creating ? "Saving..." : "Create product"}
                </button>
                </div>
            </div>
            </div>
        )}

        {/* Edit product modal */}
        {isEditModalOpen && selectedProduct && (
            <div className="modal-backdrop" onClick={closeEditModal}>
            <div
                className="modal"
                onClick={(e) => {
                e.stopPropagation();
                }}
            >
                <h2 className="modal-title">
                Edit product – {selectedProduct.name}
                </h2>
                <p className="modal-subtitle">
                Update product details. Inventory levels are managed via
                sales and receiving stock.
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
                    <label htmlFor="edit-platform">Platform</label>
                    <input
                    id="edit-platform"
                    name="platform"
                    type="text"
                    value={editForm.platform}
                    onChange={handleEditChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="edit-edition">Edition</label>
                    <input
                    id="edit-edition"
                    name="edition"
                    type="text"
                    value={editForm.edition}
                    onChange={handleEditChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="edit-genre">Genre</label>
                    <input
                    id="edit-genre"
                    name="genre"
                    type="text"
                    value={editForm.genre}
                    onChange={handleEditChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="edit-base-price">Base price</label>
                    <input
                    id="edit-base-price"
                    name="base_price"
                    type="number"
                    step="0.01"
                    value={editForm.base_price}
                    onChange={handleEditChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="edit-supplier">Supplier</label>
                    <select
                    id="edit-supplier"
                    name="supplier_id"
                    value={editForm.supplier_id}
                    onChange={handleEditChange}
                    >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                        {s.name}
                        </option>
                    ))}
                    </select>
                </div>

                <div className="form-field form-field-inline">
                    <label>Availability</label>
                    <div className="checkbox-row">
                    <label>
                        <input
                        type="checkbox"
                        name="is_physical"
                        checked={editForm.is_physical}
                        onChange={handleEditCheckbox}
                        />
                        Physical
                    </label>
                    <label>
                        <input
                        type="checkbox"
                        name="is_digital"
                        checked={editForm.is_digital}
                        onChange={handleEditCheckbox}
                        />
                        Digital
                    </label>
                    </div>
                </div>

                {editError && <p className="form-error">{editError}</p>}
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
                    onClick={handleEditSave}
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

export default ProductsPage;
