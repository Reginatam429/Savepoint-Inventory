import { useEffect, useState } from "react";
import { api } from "../api";

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="page">
        <div className="page-header">
            <div>
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">
                Saved customers associated with in-store and online orders.
            </p>
            </div>
        </div>

        {loading ? (
            <div className="loading">Loading customers...</div>
        ) : (
            <div className="card">
            <div className="table-wrapper">
                <table className="table">
                <thead>
                    <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c) => (
                    <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td>
                        {c.created_at
                            ? new Date(c.created_at).toLocaleDateString()
                            : "-"}
                        </td>
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

export default CustomersPage;
