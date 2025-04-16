import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import TradingChart from "./TradingChart";
import Login from "./Login";
import Portfolio from "./Portfolio";
import "./App.css";
import RiskModal from "./RiskModal";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

function TradingComponent() {
  const [balance, setBalance] = useState(100000);
  const [price, setPrice] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("0.00");
  const [stockSymbol, setStockSymbol] = useState("AAPL");
  const [tradeSuccess, setTradeSuccess] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(true);
  const [activeTab, setActiveTab] = useState("trade"); // 'trade' or 'portfolio'

  useEffect(() => {
    socket.on("priceUpdate", (data) => {
      setPrice(parseFloat(data.price).toFixed(2));
    });
    return () => socket.off("priceUpdate");
  }, []);

  useEffect(() => {
    if (price && quantity) {
      setTotalCost((quantity * price).toFixed(2));
    } else {
      setTotalCost("0.00");
    }
  }, [price, quantity]);

  const changeStock = (e) => {
    const newSymbol = e.target.value.toUpperCase();
    setStockSymbol(newSymbol);
    socket.emit("changeSymbol", newSymbol);
  };

  const executeTrade = (type) => {
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    if (!price) {
      alert("Price is not available yet.");
      return;
    }

    const qty = parseFloat(quantity);
    const cost = qty * parseFloat(price);

    if (type === "buy") {
      if (cost > balance) {
        alert("Insufficient balance to execute buy order.");
        return;
      }
      setBalance(balance - cost);
    } else {
      setBalance(balance + cost);
    }

    setTradeSuccess(`${type === "buy" ? "Purchased" : "Sold"} ${qty} shares of ${stockSymbol} @ $${price}`);
    setTimeout(() => setTradeSuccess(null), 5000);
    setQuantity("");
  };

  // ✅ Render modal AFTER login
  if (showRiskModal) {
    return <RiskModal onAcknowledge={() => setShowRiskModal(false)} />;
  }

  return (
    <div className="trading-container" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="sidebar-title">TradeSim Pro</h2>
        <div className="sidebar-balance">
          <label className="balance-label">Account Balance</label>
          <div className="balance-amount">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="sidebar-navigation" style={{ marginTop: "20px" }}>
          <div 
            className={`sidebar-nav-item ${activeTab === "trade" ? "active" : ""}`} 
            onClick={() => setActiveTab("trade")}
            style={{ 
              padding: "12px 16px", 
              borderRadius: "8px", 
              cursor: "pointer", 
              background: activeTab === "trade" ? "rgba(255, 255, 255, 0.1)" : "transparent",
              marginBottom: "10px"
            }}
          >
            Trading
          </div>
          <div 
            className={`sidebar-nav-item ${activeTab === "portfolio" ? "active" : ""}`}
            onClick={() => setActiveTab("portfolio")}
            style={{ 
              padding: "12px 16px", 
              borderRadius: "8px", 
              cursor: "pointer", 
              background: activeTab === "portfolio" ? "rgba(255, 255, 255, 0.1)" : "transparent" 
            }}
          >
            Portfolio
          </div>
        </div>

        {activeTab === "trade" && (
          <>
            <div className="sidebar-inputs">
              <label className="sidebar-label">Stock Symbol</label>
              <input
                type="text"
                value={stockSymbol}
                onChange={changeStock}
                placeholder="AAPL, TSLA..."
              />
            </div>

            <div className="sidebar-price">
              <label className="sidebar-label">Current Price</label>
              <div className="sidebar-price-amount">
                {price ? `$${price}` : "Loading..."}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {activeTab === "trade" ? (
          <>
            <div className="chart-container">
              <TradingChart symbol={`NASDAQ:${stockSymbol}`} />
            </div>

            <div className="trading-panel">
              <h2>Trade {stockSymbol}</h2>

              <div className="input-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter number of shares"
                />
              </div>

              <div className="cost-display">
                <strong>Total Cost:</strong> ${totalCost}
              </div>

              <div className="trade-buttons">
                <button className="buy-btn" onClick={() => executeTrade("buy")}>
                  Buy
                </button>
                <button className="sell-btn" onClick={() => executeTrade("sell")}>
                  Sell
                </button>
              </div>
            </div>
          </>
        ) : (
          <Portfolio balance={balance} socket={socket} />
        )}
      </div>

      {/* FLOATING NOTIFICATION */}
      {tradeSuccess && (
        <div className="floating-notification">
          <button className="close-btn" onClick={() => setTradeSuccess(null)}>×</button>
          <div className="notification-content">{tradeSuccess}</div>
          <div className="progress-bar"></div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <Login onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <TradingComponent />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
