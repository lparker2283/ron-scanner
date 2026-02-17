import { calculateCutlerRSI } from "./cutler-rsi.js";

/**
 * Criterion 1: Sector Money Flow
 * Check if the stock's sector ETF is trending positively.
 */
export function checkSectorFlow(sectorFlowData) {
  const met = sectorFlowData && sectorFlowData.trending;
  return {
    met,
    value: sectorFlowData?.flow || 0,
    detail: met
      ? `Sector inflows: $${sectorFlowData.flow}B over 30 days`
      : "Sector showing outflows or flat activity",
  };
}

/**
 * Criterion 2: Consolidation Breakout
 * Volume contracted during consolidation, now expanding.
 */
export function checkConsolidationBreakout(dailyData) {
  if (!dailyData || dailyData.length < 130) {
    return { met: false, value: 0, detail: "Insufficient data" };
  }

  // Consolidation window: days 0-99, Recent window: days 100-129
  const consolidationWindow = dailyData.slice(-130, -30);
  const recentWindow = dailyData.slice(-30);

  // Average volume comparison
  const consolAvgVol =
    consolidationWindow.reduce((s, d) => s + d.volume, 0) /
    consolidationWindow.length;
  const recentAvgVol =
    recentWindow.reduce((s, d) => s + d.volume, 0) / recentWindow.length;
  const volChange = (recentAvgVol - consolAvgVol) / consolAvgVol;

  // ATR compression during consolidation (check price range was tight)
  const consolHighs = consolidationWindow.map((d) => d.high);
  const consolLows = consolidationWindow.map((d) => d.low);
  const consolRange =
    Math.max(...consolHighs) - Math.min(...consolLows);
  const avgConsolPrice =
    consolidationWindow.reduce((s, d) => s + d.close, 0) /
    consolidationWindow.length;
  const rangePercent = consolRange / avgConsolPrice;

  // Volume expanding >25% and consolidation range was relatively tight (<25%)
  const met = volChange > 0.25 && rangePercent < 0.25;

  return {
    met,
    value: Math.round(volChange * 100),
    detail: met
      ? `Volume up ${Math.round(volChange * 100)}% from consolidation, range ${Math.round(rangePercent * 100)}%`
      : `Volume change: ${Math.round(volChange * 100)}%, range: ${Math.round(rangePercent * 100)}%`,
  };
}

/**
 * Criterion 3: 50-Day SMA Slope
 * The 50-day SMA is flattening or turning upward.
 */
export function checkSMASlope(dailyData) {
  if (!dailyData || dailyData.length < 60) {
    return { met: false, value: 0, detail: "Insufficient data" };
  }

  const closes = dailyData.map((d) => d.close);

  // Calculate 50-day SMA for the last 10 days
  function sma50AtIndex(idx) {
    if (idx < 49) return null;
    let sum = 0;
    for (let i = idx - 49; i <= idx; i++) {
      sum += closes[i];
    }
    return sum / 50;
  }

  const lastIdx = closes.length - 1;
  const smaToday = sma50AtIndex(lastIdx);
  const sma10Ago = sma50AtIndex(lastIdx - 10);
  const sma20Ago = lastIdx >= 69 ? sma50AtIndex(lastIdx - 20) : null;

  if (!smaToday || !sma10Ago) {
    return { met: false, value: 0, detail: "Insufficient data for SMA" };
  }

  const slope = smaToday - sma10Ago;
  const slopePercent = (slope / sma10Ago) * 100;

  // Check for inflection point (was negative 20 days ago, now positive)
  let inflection = false;
  if (sma20Ago) {
    const oldSlope = sma10Ago - sma20Ago;
    inflection = oldSlope < 0 && slope >= 0;
  }

  const met = slope >= 0;

  return {
    met,
    value: Math.round(slopePercent * 100) / 100,
    detail: met
      ? `50-SMA slope: +${slopePercent.toFixed(2)}%${inflection ? " (inflection point!)" : ""}`
      : `50-SMA still declining: ${slopePercent.toFixed(2)}%`,
    inflection,
  };
}

/**
 * Criterion 4: Cutler's RSI Signal
 * RSI (SMA-based) between 40-60, reject <30 or >70.
 */
export function checkCutlerRSI(dailyData) {
  if (!dailyData || dailyData.length < 15) {
    return { met: false, value: 0, detail: "Insufficient data" };
  }

  const closes = dailyData.map((d) => d.close);
  const rsi = calculateCutlerRSI(closes, 14);

  if (rsi === null) {
    return { met: false, value: 0, detail: "Could not calculate RSI" };
  }

  const rounded = Math.round(rsi * 10) / 10;
  const met = rsi >= 40 && rsi <= 60;

  let detail;
  if (rsi < 30) detail = `RSI ${rounded} — oversold, likely still falling`;
  else if (rsi > 70) detail = `RSI ${rounded} — overbought, late entry`;
  else if (met) detail = `RSI ${rounded} — emerging momentum zone`;
  else if (rsi < 40) detail = `RSI ${rounded} — below buy zone`;
  else detail = `RSI ${rounded} — above ideal zone but not overbought`;

  return { met, value: rounded, detail };
}

/**
 * Criterion 5: Higher Highs Pattern
 * Price made a local high, pulled back, then broke above (seller exhaustion).
 */
export function checkHigherHighs(dailyData) {
  if (!dailyData || dailyData.length < 60) {
    return { met: false, value: 0, detail: "Insufficient data" };
  }

  const recent = dailyData.slice(-60);
  const closes = recent.map((d) => d.close);

  // Find local peaks (higher than 3 days before and after)
  const peaks = [];
  for (let i = 3; i < closes.length - 3; i++) {
    const isPeak =
      closes[i] > closes[i - 1] &&
      closes[i] > closes[i - 2] &&
      closes[i] > closes[i - 3] &&
      closes[i] > closes[i + 1] &&
      closes[i] > closes[i + 2] &&
      closes[i] > closes[i + 3];
    if (isPeak) {
      peaks.push({ index: i, price: closes[i] });
    }
  }

  if (peaks.length < 2) {
    return {
      met: false,
      value: peaks.length,
      detail: `Only ${peaks.length} peak(s) found — need at least 2 for higher highs`,
    };
  }

  // Check for higher highs pattern
  let higherHighCount = 0;
  let doubleConfirmed = false;

  for (let i = 1; i < peaks.length; i++) {
    if (peaks[i].price > peaks[i - 1].price) {
      higherHighCount++;
    }
  }

  if (higherHighCount >= 2) doubleConfirmed = true;

  const met = higherHighCount >= 1;

  return {
    met,
    value: higherHighCount,
    detail: met
      ? `${higherHighCount} higher high(s) confirmed${doubleConfirmed ? " (double confirmed)" : ""}`
      : "No higher highs pattern detected",
    doubleConfirmed,
  };
}

/**
 * Evaluate all 5 criteria for a stock.
 */
export function evaluateStock(dailyData, sectorFlowData) {
  const criteria = [
    { name: "Sector Flow", ...checkSectorFlow(sectorFlowData) },
    { name: "Consolidation", ...checkConsolidationBreakout(dailyData) },
    { name: "SMA Slope", ...checkSMASlope(dailyData) },
    { name: "Cutler RSI", ...checkCutlerRSI(dailyData) },
    { name: "Higher Highs", ...checkHigherHighs(dailyData) },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  let tier = null;
  if (metCount === 5) tier = 1;
  else if (metCount >= 3) tier = 2;

  return { criteria, metCount, tier };
}
