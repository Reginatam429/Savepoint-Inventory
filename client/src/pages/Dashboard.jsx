import { useEffect, useMemo, useState } from "react";
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
    LineChart,
    Line,
} from "recharts";

const CHANNEL_COLORS = ["#14b8a6", "#6366f1"]; // turquoise + indigo
const PRODUCT_COLORS = ["#06b6d4", "#22c55e", "#a855f7", "#f97316", "#ec4899"];

const getDateRange = (period) => {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);

    if (period === "last_30") {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { from: start.toISOString().slice(0, 10), to: end };
    }

    if (period === "last_90") {
        const start = new Date();
        start.setDate(start.getDate() - 90);
        return { from: start.toISOString().slice(0, 10), to: end };
    }

    if (period === "ytd") {
        const start = new Date(now.getFullYear(), 0, 1);
        return { from: start.toISOString().slice(0, 10), to: end };
    }

    return { from: undefined, to: undefined }; // all time
};

const Dashboard = ({ onNavigate }) => {
    const [period, setPeriod] = useState("last_90");
    const [channelFilter, setChannelFilter] = useState("all");

    const [orders, setOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [salesByChannel, setSalesByChannel] = useState([]);
    const [lowStock, setLowStock] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { from, to } = getDateRange(period);

        const paramsForSales = {
        ...(channelFilter !== "all" ? { channel: channelFilter } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        };

        const paramsForReports = {
        ...(channelFilter !== "all" ? { channel: channelFilter } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        };

        const fetchData = async () => {
        setLoading(true);
        try {
            const [salesRes, topRes, channelRes, lowRes] = await Promise.all([
            api.get("/sales", { params: paramsForSales }),
            api.get("/reports/top-products", {
                params: { ...paramsForReports, limit: 5 },
            }),
            api.get("/reports/sales-by-channel", {
                params: { ...(from ? { from } : {}), ...(to ? { to } : {}) },
            }),
            api.get("/inventory/low-stock"),
            ]);

            setOrders(salesRes.data || []);
            setTopProducts(topRes.data || []);
            setSalesByChannel(channelRes.data || []);
            setLowStock(lowRes.data || []);
        } catch (err) {
            console.error("Error loading dashboard data", err);
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, [period, channelFilter]);

    // --- KPIs + revenue series from orders ---
    const { totalRevenue, totalOrders, avgOrderValue, revenueSeries } = useMemo(
        () => {
        if (!orders || orders.length === 0) {
            return {
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            revenueSeries: [],
            };
        }

        let totalRevenueAcc = 0;
        const dayMap = new Map();

        orders.forEach((o) => {
            const amount = Number(o.total_amount || 0);
            totalRevenueAcc += amount;

            const dayKey = o.order_date.slice(0, 10);
            dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + amount);
        });

        const totalOrders = orders.length;
        const avgOrderValue = totalOrders ? totalRevenueAcc / totalOrders : 0;

        const revenueSeries = Array.from(dayMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, revenue]) => {
            const d = new Date(dateKey);
            const label = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            });
            return { dateKey, label, revenue };
            });

        return {
            totalRevenue: totalRevenueAcc,
            totalOrders,
            avgOrderValue,
            revenueSeries,
        };
        },
        [orders]
    );

    // --- Safe, numeric data for channel pie ---
    const channelChartData = useMemo(
        () =>
        (salesByChannel || [])
            .map((row) => ({
            channel: row.channel,
            total_revenue: Number(row.total_revenue || 0),
            }))
            .filter((r) => r.total_revenue > 0),
        [salesByChannel]
    );

    const formatCurrency = (value) =>
        `$${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        })}`;

    if (loading) {
        return <div className="page">Loading dashboard...</div>;
    }

    return (
        <div className="page">
        {/* Header + filters */}
        <div className="page-header">
            <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
                High-level view of SavePoint sales, channels, and inventory health.
            </p>
            </div>

            <div className="dashboard-filter-group">
            <div className="filter-group-inline">
                <span className="filter-label-inline">Period:</span>
                <select
                className="filter-select-inline"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                >
                <option value="last_30">Last 30 days</option>
                <option value="last_90">Last 90 days</option>
                <option value="ytd">Year to date</option>
                <option value="all">All time</option>
                </select>
            </div>

            <div className="filter-group-inline">
                <span className="filter-label-inline">Channel:</span>
                <select
                className="filter-select-inline"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                >
                <option value="all">All channels</option>
                <option value="in_store">In-store</option>
                <option value="online">Online</option>
                </select>
            </div>
            </div>
        </div>

        {/* ROW 1 */}
        <div className="dashboard-grid-row1">
            {/* Revenue over time */}
            <section className="card card-lg">
            <div className="card-header">
                <div>
                <h2 className="card-title">Revenue over time</h2>
                <p className="card-subtitle">
                    Daily revenue in the selected period and channel.
                </p>
                </div>
            </div>

            {revenueSeries.length === 0 ? (
                <p className="card-empty">No sales data for this period.</p>
            ) : (
                <div className="chart-wrapper">
                <ResponsiveContainer>
                    <LineChart data={revenueSeries}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(label) => label}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        dot={false}
                        strokeWidth={2}
                    />
                    </LineChart>
                </ResponsiveContainer>
                </div>
            )}
            </section>

            {/* Key metrics */}
            <section className="card card-kpis">
            <div className="card-header">
                <h2 className="card-title">Key metrics</h2>
            </div>

            <div className="kpi-headline">
                <span className="kpi-headline-label">Total revenue</span>
                <span className="kpi-headline-value">
                {formatCurrency(totalRevenue)}
                </span>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                <span className="kpi-label">Total orders</span>
                <span className="kpi-value">
                    {totalOrders.toLocaleString()}
                </span>
                </div>
                <div className="kpi-card">
                <span className="kpi-label">Avg order value</span>
                <span className="kpi-value">
                    {totalOrders ? formatCurrency(avgOrderValue) : "—"}
                </span>
                </div>
                <div className="kpi-card">
                <span className="kpi-label">Low-stock titles</span>
                <span className="kpi-value">{lowStock.length}</span>
                </div>
            </div>
            </section>

            {/* Sales by channel */}
            <section className="card">
            <div className="card-header">
                <div>
                <h2 className="card-title">Sales by channel</h2>
                <p className="card-subtitle">
                    Revenue split across in-store vs online.
                </p>
                </div>
            </div>

            {channelChartData.length === 0 ? (
                <p className="card-empty">
                No channel data for this period.
                </p>
            ) : (
                <div className="chart-wrapper chart-wrapper-small">
                <ResponsiveContainer>
                    <PieChart>
                    <Pie
                        data={channelChartData}
                        dataKey="total_revenue"
                        nameKey="channel"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                    >
                        {channelChartData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={
                            CHANNEL_COLORS[index % CHANNEL_COLORS.length]
                            }
                        />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            )}
            </section>
        </div>

        {/* ROW 2 */}
        <div className="dashboard-grid-row2">
            {/* Top products */}
            <section className="card">
            <div className="card-header">
                <div>
                <h2 className="card-title">Top-selling products</h2>
                <p className="card-subtitle">
                    By units sold in the selected period / channel.
                </p>
                </div>
            </div>

            {topProducts.length === 0 ? (
                <p className="card-empty">No sales data.</p>
            ) : (
                <div className="chart-wrapper">
                <ResponsiveContainer>
                    <BarChart data={topProducts}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_units_sold">
                        {topProducts.map((entry, index) => (
                        <Cell
                            key={`bar-${index}`}
                            fill={
                            PRODUCT_COLORS[index % PRODUCT_COLORS.length]
                            }
                        />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            )}
            </section>

            {/* Low stock */}
            <section className="card card-low-stock">
            <div className="card-header">
                <div>
                <h2 className="card-title">Low stock alerts</h2>
                <p className="card-subtitle">
                    Products below their reorder level.
                </p>
                </div>
            </div>

            {lowStock.length === 0 ? (
                <p className="card-empty">
                No products are currently below their reorder level.
                </p>
            ) : (
                <div className="table-wrapper table-scroll-small">
                <table className="table table-compact">
                    <thead>
                    <tr>
                        <th>Product</th>
                        <th>Platform</th>
                        <th>On hand</th>
                        <th>Reorder</th>
                        <th>Supplier</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lowStock.map((item) => (
                        <tr key={item.product_id}>
                        <td>{item.name}</td>
                        <td>{item.platform}</td>
                        <td>{item.quantity_on_hand}</td>
                        <td>{item.reorder_level}</td>
                        <td>{item.supplier_name}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            {lowStock.length > 0 && (
                <div className="table-footer">
                    <span>
                        {lowStock.length} product
                        {lowStock.length === 1 ? "" : "s"} below reorder level
                    </span>
                    <div className="table-footer-actions">
                        <button
                        className="btn-secondary btn-pill"
                        type="button"
                        onClick={() => onNavigate && onNavigate("Products")}
                        >
                        Manage stock
                        </button>
                    </div>
                    </div>
            )}
            </section>
        </div>
        </div>
    );
};

export default Dashboard;
