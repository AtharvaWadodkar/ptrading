import React, { useState, useEffect } from "react";
import PortfolioSummary from "./PortfolioSummary";
import "./Portfolio.css";

function Portfolio({ balance, socket }) {
  const [holdings, setHoldings] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [newSymbol, setNewSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [realTimePrices, setRealTimePrices] = useState({});

  // Load mock portfolio data (in a real app, this would come from a database)
  useEffect(() => {
    // Mock data for initial portfolio
    const initialHoldings = [
      { symbol: "AAPL", name: "Apple Inc.", quantity: 10, avgPrice: 150.00, currentPrice: 0 },
      { symbol: "MSFT", name: "Microsoft Corporation", quantity: 5, avgPrice: 280.00, currentPrice: 0 },
      { symbol: "GOOGL", name: "Alphabet Inc.", quantity: 2, avgPrice: 2750.00, currentPrice: 0 },
    ];
    
    setHoldings(initialHoldings);
  }, []);

  // Listen for price updates from socket
  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (data) => {
      setRealTimePrices(prev => ({
        ...prev,
        [data.symbol]: parseFloat(data.price)
      }));
    };

    socket.on("priceUpdate", handlePriceUpdate);
    
    // Request initial prices for all holdings
    holdings.forEach(holding => {
      socket.emit("changeSymbol", holding.symbol);
    });

    return () => {
      socket.off("priceUpdate", handlePriceUpdate);
    };
  }, [socket, holdings]);

  // Calculate portfolio value whenever prices update
  useEffect(() => {
    if (Object.keys(realTimePrices).length === 0) return;

    let portfolioValue = 0;
    let investmentValue = 0;

    holdings.forEach(holding => {
      const currentPrice = realTimePrices[holding.symbol] || holding.avgPrice;
      
      portfolioValue += currentPrice * holding.quantity;
      investmentValue += holding.avgPrice * holding.quantity;
    });

    setTotalValue(portfolioValue);
    setTotalReturn(portfolioValue - investmentValue);
  }, [realTimePrices, holdings]);

  const addStock = (e) => {
    e.preventDefault();
    
    if (!newSymbol || !quantity || isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid symbol and quantity");
      return;
    }

    // Get current price from realTimePrices, or use a default
    const currentPrice = realTimePrices[newSymbol.toUpperCase()] || 100.00;
    
    const newStock = {
      symbol: newSymbol.toUpperCase(),
      name: `${newSymbol.toUpperCase()} Stock`, // In a real app, fetch company name from an API
      quantity: parseFloat(quantity),
      avgPrice: currentPrice,
      currentPrice
    };

    setHoldings([...holdings, newStock]);
    
    // Request price updates for the new stock
    if (socket) {
      socket.emit("changeSymbol", newSymbol.toUpperCase());
    }
    
    // Clear form
    setNewSymbol("");
    setQuantity("");
  };

  const removeStock = (symbolToRemove) => {
    setHoldings(holdings.filter(stock => stock.symbol !== symbolToRemove));
  };

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <h2>Your Portfolio</h2>
        <div>
          <div className="portfolio-value">
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`portfolio-change ${totalReturn >= 0 ? "change-positive" : "change-negative"}`}>
            {totalReturn >= 0 ? "+" : ""}
            ${Math.abs(totalReturn).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            ({totalValue ? ((totalReturn / (totalValue - totalReturn)) * 100).toFixed(2) : 0}%)
          </div>
        </div>
      </div>

      <PortfolioSummary holdings={holdings} realTimePrices={realTimePrices} />

      {holdings.length > 0 ? (
        <div className="holdings-list">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Quantity</th>
                <th>Avg. Price</th>
                <th>Current</th>
                <th>Value</th>
                <th>Return</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((stock) => {
                const currentPrice = realTimePrices[stock.symbol] || stock.avgPrice;
                const stockValue = currentPrice * stock.quantity;
                const stockReturn = (currentPrice - stock.avgPrice) * stock.quantity;
                const returnPercentage = ((currentPrice - stock.avgPrice) / stock.avgPrice) * 100;
                
                return (
                  <tr key={stock.symbol}>
                    <td>
                      <div className="stock-symbol">{stock.symbol}</div>
                      <div className="stock-name">{stock.name}</div>
                    </td>
                    <td>{stock.quantity}</td>
                    <td>${stock.avgPrice.toFixed(2)}</td>
                    <td>${currentPrice.toFixed(2)}</td>
                    <td>${stockValue.toFixed(2)}</td>
                    <td className={stockReturn >= 0 ? "change-positive" : "change-negative"}>
                      {stockReturn >= 0 ? "+" : ""}${Math.abs(stockReturn).toFixed(2)} ({returnPercentage.toFixed(2)}%)
                    </td>
                    <td>
                      <button onClick={() => removeStock(stock.symbol)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-portfolio">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/>
          </svg>
          <h3>Your portfolio is empty</h3>
          <p>Add some stocks to your portfolio to start tracking your investments</p>
        </div>
      )}

      <form className="add-stock-form" onSubmit={addStock}>
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="Stock Symbol (e.g. AAPL)"
          required
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          min="0.01"
          step="0.01"
          required
        />
        <button type="submit" className="add-stock-btn">Add Stock</button>
      </form>
    </div>
  );
}

export default Portfolio;
