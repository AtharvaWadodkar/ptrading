import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

function PortfolioSummary({ holdings, realTimePrices }) {
  const [pieData, setPieData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    assets: 0,
    gainers: 0,
    losers: 0,
    bestStock: { symbol: "", return: 0 },
    worstStock: { symbol: "", return: 0 }
  });

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6"];

  useEffect(() => {
    if (holdings.length === 0 || Object.keys(realTimePrices).length === 0) return;

    // Calculate data for pie chart
    const chartData = holdings.map((stock, index) => {
      const currentPrice = realTimePrices[stock.symbol] || stock.avgPrice;
      const value = currentPrice * stock.quantity;
      
      return {
        name: stock.symbol,
        value
      };
    });

    setPieData(chartData);

    // Calculate summary metrics
    let totalAssets = 0;
    let gainersCount = 0;
    let losersCount = 0;
    let bestReturn = -Infinity;
    let worstReturn = Infinity;
    let bestStock = "";
    let worstStock = "";

    holdings.forEach(stock => {
      const currentPrice = realTimePrices[stock.symbol] || stock.avgPrice;
      const value = currentPrice * stock.quantity;
      const returnPct = ((currentPrice - stock.avgPrice) / stock.avgPrice) * 100;

      totalAssets += value;
      
      if (currentPrice > stock.avgPrice) gainersCount++;
      if (currentPrice < stock.avgPrice) losersCount++;
      
      if (returnPct > bestReturn) {
        bestReturn = returnPct;
        bestStock = stock.symbol;
      }
      
      if (returnPct < worstReturn) {
        worstReturn = returnPct;
        worstStock = stock.symbol;
      }
    });

    setSummaryData({
      assets: totalAssets,
      gainers: gainersCount,
      losers: losersCount,
      bestStock: { symbol: bestStock, return: bestReturn },
      worstStock: { symbol: worstStock, return: worstReturn }
    });

  }, [holdings, realTimePrices]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "white", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>{payload[0].name}</p>
          <p style={{ margin: 0 }}>
            ${payload[0].value.toFixed(2)} ({((payload[0].value / summaryData.assets) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (holdings.length === 0) return null;

  return (
    <div>
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total Assets</div>
          <div className="summary-value">
            ${summaryData.assets.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-label">Gainers/Losers</div>
          <div className="summary-value">
            {summaryData.gainers}/{summaryData.losers}
          </div>
        </div>
        
        {summaryData.bestStock.symbol && (
          <div className="summary-card">
            <div className="summary-label">Best Performer</div>
            <div className="summary-value" style={{ color: "#10B981" }}>
              {summaryData.bestStock.symbol} ({summaryData.bestStock.return.toFixed(1)}%)
            </div>
          </div>
        )}
        
        {summaryData.worstStock.symbol && (
          <div className="summary-card">
            <div className="summary-label">Worst Performer</div>
            <div className="summary-value" style={{ color: "#EF4444" }}>
              {summaryData.worstStock.symbol} ({summaryData.worstStock.return.toFixed(1)}%)
            </div>
          </div>
        )}
      </div>

      {pieData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default PortfolioSummary;
