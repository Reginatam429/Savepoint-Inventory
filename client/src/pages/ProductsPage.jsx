import { useEffect, useState } from "react";
import { api } from "../api";

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data);
        } catch (err) {
            console.error("Error loading products", err);
        } finally {
            setLoading(false);
        }
        };
        load();
    }, []);

    return (
        <div className="page">
        <div className="page-header">
            <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">
                View all games currently tracked in SavePoint inventory.
            </p>
            </div>
        </div>

        {loading ? (
            <div className="loading">Loading products...</div>
        ) : (
            <div className="card">
            <div className="table-wrapper">
                <table className="table">
                <thead>
                    <tr>
                    <th>Name</th>
                    <th>Platform</th>
                    <th>Edition</th>
                    <th>Genre</th>
                    <th>Base Price</th>
                    <th>On Hand</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.platform}</td>
                        <td>{p.edition}</td>
                        <td>{p.genre}</td>
                        <td>${Number(p.base_price).toFixed(2)}</td>
                        <td>{p.quantity_on_hand ?? "-"}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        )}
        </div>
    );
};

export default ProductsPage;
