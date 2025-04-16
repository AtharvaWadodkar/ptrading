import React, { useEffect, useRef } from "react";

const TradingChart = ({ symbol }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.innerHTML = ""; // Clear previous
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      /* global TradingView */
      new window.TradingView.widget({
        symbol: symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: "tradingview_chart",
        width: "100%",
        height: "100%", // Fills the .chart-container
      });
    };
    chartRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      id="tradingview_chart"
      ref={chartRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default TradingChart;
