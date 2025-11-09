import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";

const TABS = ["Dashboard", "Products", "Customers", "Sales"];

const App = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "Products":
        return <ProductsPage />;
      case "Customers":
        return <CustomersPage />;
      case "Sales":
        return <SalesPage />;
      case "Dashboard":
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      {/* Top navigation bar */}
      <header className="top-nav">
        <div className="nav-left">
          <div className="logo-mark">🎮</div>
          <div className="logo-text">
            <span className="logo-title">SavePoint</span>
            <span className="logo-subtitle">Inventory Console</span>
          </div>
        </div>

        <nav className="nav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={
                "nav-tab" + (activeTab === tab ? " nav-tab--active" : "")
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">{renderContent()}</main>
    </div>
  );
};

export default App;
