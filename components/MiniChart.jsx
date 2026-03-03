"use client";

import { useRef, useEffect } from "react";

export default function MiniChart({ dailyData, width = 400, height = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dailyData || dailyData.length < 2) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const closes = dailyData.map((d) => d.close);
    const minPrice = Math.min(...closes) * 0.99;
    const maxPrice = Math.max(...closes) * 1.01;
    const priceRange = maxPrice - minPrice;

    const padding = { top: 10, right: 10, bottom: 24, left: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    function x(i) {
      return padding.left + (i / (closes.length - 1)) * chartW;
    }
    function y(price) {
      return padding.top + (1 - (price - minPrice) / priceRange) * chartH;
    }

    // 50-day SMA
    const sma50 = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < 49) {
        sma50.push(null);
      } else {
        let sum = 0;
        for (let j = i - 49; j <= i; j++) sum += closes[j];
        sma50.push(sum / 50);
      }
    }

    // Draw SMA line (gold dashed)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#D4A054";
    ctx.lineWidth = 1.2;
    let started = false;
    for (let i = 0; i < sma50.length; i++) {
      if (sma50[i] === null) continue;
      if (!started) {
        ctx.moveTo(x(i), y(sma50[i]));
        started = true;
      } else {
        ctx.lineTo(x(i), y(sma50[i]));
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw price line (green)
    ctx.beginPath();
    ctx.strokeStyle = "#8BA87E";
    ctx.lineWidth = 1.5;
    ctx.moveTo(x(0), y(closes[0]));
    for (let i = 1; i < closes.length; i++) {
      ctx.lineTo(x(i), y(closes[i]));
    }
    ctx.stroke();

    // Gradient fill under price line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, "rgba(139, 168, 126, 0.15)");
    gradient.addColorStop(1, "rgba(139, 168, 126, 0)");

    ctx.beginPath();
    ctx.moveTo(x(0), y(closes[0]));
    for (let i = 1; i < closes.length; i++) {
      ctx.lineTo(x(i), y(closes[i]));
    }
    ctx.lineTo(x(closes.length - 1), padding.top + chartH);
    ctx.lineTo(x(0), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Legend
    ctx.font = "10px monospace";
    ctx.fillStyle = "#8BA87E";
    ctx.fillText("Price", width - 95, height - 6);
    ctx.fillStyle = "#D4A054";
    ctx.fillText("50 SMA", width - 52, height - 6);
  }, [dailyData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "block",
        borderRadius: "6px",
      }}
    />
  );
}
