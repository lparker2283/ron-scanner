/**
 * Mock scan data for development and fallback when no real scan data exists yet.
 */

function generateMockChart(basePrice, days = 130) {
  const data = [];
  let price = basePrice * 0.85;
  const now = new Date();

  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Gradual uptrend with some noise
    const trend = (days - i) / days;
    const noise = (Math.random() - 0.45) * basePrice * 0.02;
    price = price + noise + trend * basePrice * 0.001;
    price = Math.max(price, basePrice * 0.75);

    data.push({
      date: date.toISOString(),
      close: Math.round(price * 100) / 100,
      volume: Math.round(800000 + Math.random() * 1200000 + trend * 500000),
    });
  }

  return data;
}

export const MOCK_DATA = {
  date: new Date().toISOString().split("T")[0],
  scanTime: new Date().toISOString(),
  elapsed: 187,
  totalScanned: 312,
  sectorFlows: {
    Technology: { etf: "XLK", flow: 2.4, trending: true, priceChange: 3.2, volChange: 8.1 },
    Energy: { etf: "XLE", flow: 1.8, trending: true, priceChange: 2.8, volChange: 5.2 },
    "Health Care": { etf: "XLV", flow: 1.1, trending: true, priceChange: 1.5, volChange: 2.3 },
    Financials: { etf: "XLF", flow: 0.6, trending: true, priceChange: 0.9, volChange: 1.1 },
    Industrials: { etf: "XLI", flow: 0.3, trending: true, priceChange: 0.4, volChange: -0.5 },
    "Consumer Discretionary": { etf: "XLY", flow: -0.3, trending: false, priceChange: -0.4, volChange: -2.1 },
    "Communication Services": { etf: "XLC", flow: -0.5, trending: false, priceChange: -0.7, volChange: -1.8 },
    Materials: { etf: "XLB", flow: -0.6, trending: false, priceChange: -0.8, volChange: -3.2 },
    Utilities: { etf: "XLU", flow: -0.9, trending: false, priceChange: -1.2, volChange: -4.1 },
    "Consumer Staples": { etf: "XLP", flow: -1.1, trending: false, priceChange: -1.4, volChange: -2.8 },
    "Real Estate": { etf: "XLRE", flow: -1.4, trending: false, priceChange: -1.8, volChange: -5.5 },
  },
  picks: [
    {
      ticker: "PLTR",
      name: "Palantir Technologies",
      sector: "Technology",
      price: 38.42,
      stopLoss: 36.11,
      tier: 1,
      metCount: 5,
      volumeChange: 47,
      criteria: [
        { name: "Sector Flow", met: true, value: 2.4, detail: "Sector inflows: $2.4B over 30 days" },
        { name: "Consolidation", met: true, value: 47, detail: "Volume up 47% from consolidation, range 18%" },
        { name: "SMA Slope", met: true, value: 0.42, detail: "50-SMA slope: +0.42%", inflection: false },
        { name: "Cutler RSI", met: true, value: 52.3, detail: "RSI 52.3 — emerging momentum zone" },
        { name: "Higher Highs", met: true, value: 2, detail: "2 higher high(s) confirmed (double confirmed)", doubleConfirmed: true },
      ],
      dailyData: generateMockChart(38.42),
    },
    {
      ticker: "CRWD",
      name: "CrowdStrike Holdings",
      sector: "Technology",
      price: 287.15,
      stopLoss: 269.92,
      tier: 1,
      metCount: 5,
      volumeChange: 38,
      criteria: [
        { name: "Sector Flow", met: true, value: 2.4, detail: "Sector inflows: $2.4B over 30 days" },
        { name: "Consolidation", met: true, value: 38, detail: "Volume up 38% from consolidation, range 15%" },
        { name: "SMA Slope", met: true, value: 0.31, detail: "50-SMA slope: +0.31% (inflection point!)", inflection: true },
        { name: "Cutler RSI", met: true, value: 48.7, detail: "RSI 48.7 — emerging momentum zone" },
        { name: "Higher Highs", met: true, value: 1, detail: "1 higher high(s) confirmed", doubleConfirmed: false },
      ],
      dailyData: generateMockChart(287.15),
    },
    {
      ticker: "EOG",
      name: "EOG Resources",
      sector: "Energy",
      price: 124.88,
      stopLoss: 117.39,
      tier: 2,
      metCount: 4,
      volumeChange: 31,
      criteria: [
        { name: "Sector Flow", met: true, value: 1.8, detail: "Sector inflows: $1.8B over 30 days" },
        { name: "Consolidation", met: true, value: 31, detail: "Volume up 31% from consolidation, range 20%" },
        { name: "SMA Slope", met: true, value: 0.18, detail: "50-SMA slope: +0.18%", inflection: false },
        { name: "Cutler RSI", met: false, value: 63.2, detail: "RSI 63.2 — above ideal zone but not overbought" },
        { name: "Higher Highs", met: true, value: 1, detail: "1 higher high(s) confirmed", doubleConfirmed: false },
      ],
      dailyData: generateMockChart(124.88),
    },
    {
      ticker: "PANW",
      name: "Palo Alto Networks",
      sector: "Technology",
      price: 312.50,
      stopLoss: 293.75,
      tier: 2,
      metCount: 4,
      volumeChange: 28,
      criteria: [
        { name: "Sector Flow", met: true, value: 2.4, detail: "Sector inflows: $2.4B over 30 days" },
        { name: "Consolidation", met: true, value: 28, detail: "Volume up 28% from consolidation, range 22%" },
        { name: "SMA Slope", met: true, value: 0.22, detail: "50-SMA slope: +0.22%", inflection: false },
        { name: "Cutler RSI", met: true, value: 55.8, detail: "RSI 55.8 — emerging momentum zone" },
        { name: "Higher Highs", met: false, value: 0, detail: "No higher highs pattern detected", doubleConfirmed: false },
      ],
      dailyData: generateMockChart(312.50),
    },
    {
      ticker: "SLB",
      name: "Schlumberger",
      sector: "Energy",
      price: 52.30,
      stopLoss: 49.16,
      tier: 2,
      metCount: 3,
      volumeChange: 26,
      criteria: [
        { name: "Sector Flow", met: true, value: 1.8, detail: "Sector inflows: $1.8B over 30 days" },
        { name: "Consolidation", met: true, value: 26, detail: "Volume up 26% from consolidation, range 19%" },
        { name: "SMA Slope", met: false, value: -0.05, detail: "50-SMA still declining: -0.05%", inflection: false },
        { name: "Cutler RSI", met: true, value: 44.1, detail: "RSI 44.1 — emerging momentum zone" },
        { name: "Higher Highs", met: false, value: 0, detail: "No higher highs pattern detected", doubleConfirmed: false },
      ],
      dailyData: generateMockChart(52.30),
    },
  ],
};
