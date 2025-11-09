import { useEffect, useState } from "react";
import { api } from "../api";

const SalesPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
        try {
            const res = await api.get("/sales");
            setOrders(res.data);
        } catch (err) {
            console.error("Error loading sales", err);
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
            <h1 className="page-title">Sales</h1>
            <p className="page-subtitle">
                Recent orders with channel, customer, and totals.
            </p>
            </div>
        </div>

        {loading ? (
            <div className="loading">Loading sales...</div>
        ) : (
            <div className="card">
            <div className="table-wrapper">
                <table className="table">
                <thead>
                    <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Channel</th>
                    <th>Customer</th>
                    <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o) => (
                    <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{new Date(o.order_date).toLocaleDateString()}</td>
                        <td>{o.channel}</td>
                        <td>{o.customer_name || "Guest"}</td>
                        <td>${Number(o.order_total).toFixed(2)}</td>
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

export default SalesPage;
