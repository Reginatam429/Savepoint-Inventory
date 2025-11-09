// client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const Dashboard = () => {
    const [topProducts, setTopProducts] = useState([]);
    const [salesByChannel, setSalesByChannel] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [channelFilter, setChannelFilter] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
        try {
            const [topRes, channelRes, lowRes] = await Promise.all([
            api.get("/reports/top-products", {
                params: {
                limit: 5,
                channel: channelFilter || undefined,
                },
            }),
            api.get("/reports/sales-by-channel"),
            api.get("/inventory/low-stock"),
            ]);

            setTopProducts(topRes.data);
            setSalesByChannel(channelRes.data);
            setLowStock(lowRes.data);
        } catch (err) {
            console.error("Error loading dashboard data", err);
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, [channelFilter]);

    if (loading) {
        return <div className="p-4">Loading dashboard...</div>;
    }

    return (
        <div className="p-4 space-y-8">
        <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">SavePoint Inventory Dashboard</h1>

            <div className="flex items-center gap-2">
            <label className="text-sm">Filter top products by channel:</label>
            <select
                className="border rounded px-2 py-1 text-sm"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
            >
                <option value="">All</option>
                <option value="in_store">In-store</option>
                <option value="online">Online</option>
            </select>
            </div>
        </header>

        {/* Top Products */}
        <section>
            <h2 className="text-xl font-semibold mb-2">Top-Selling Products</h2>
            {topProducts.length === 0 ? (
            <p className="text-sm text-gray-600">No sales data available.</p>
            ) : (
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                <BarChart data={topProducts}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_units_sold" />
                </BarChart>
                </ResponsiveContainer>
            </div>
            )}
        </section>

        {/* Sales by Channel */}
        <section>
            <h2 className="text-xl font-semibold mb-2">Sales by Channel</h2>
            {salesByChannel.length === 0 ? (
            <p className="text-sm text-gray-600">No channel data available.</p>
            ) : (
            <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                <PieChart>
                    <Pie
                    data={salesByChannel}
                    dataKey="total_revenue"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                    >
                    {salesByChannel.map((entry, index) => (
                        <Cell key={index} />
                    ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
            )}
        </section>

        {/* Low Stock Table */}
        <section>
            <h2 className="text-xl font-semibold mb-2">Low Stock Alerts</h2>
            {lowStock.length === 0 ? (
            <p className="text-sm text-gray-600">
                No products are currently below their reorder level.
            </p>
            ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                <thead>
                    <tr className="bg-gray-100">
                    <th className="px-2 py-1 border">Product</th>
                    <th className="px-2 py-1 border">Platform</th>
                    <th className="px-2 py-1 border">On Hand</th>
                    <th className="px-2 py-1 border">Reorder Level</th>
                    <th className="px-2 py-1 border">Supplier</th>
                    </tr>
                </thead>
                <tbody>
                    {lowStock.map((item) => (
                    <tr key={item.product_id}>
                        <td className="px-2 py-1 border">{item.name}</td>
                        <td className="px-2 py-1 border">{item.platform}</td>
                        <td className="px-2 py-1 border">
                        {item.quantity_on_hand}
                        </td>
                        <td className="px-2 py-1 border">
                        {item.reorder_level}
                        </td>
                        <td className="px-2 py-1 border">
                        {item.supplier_name}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </section>
        </div>
    );
};

export default Dashboard;
