// lib/data.js — Yahoo Finance adapter (no API key required)
const YF_BASE = "https://query1.finance.yahoo.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function yfFetch(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(300 * (attempt + 1));
    }
  }
}

async function fetchOHLCV(ticker, days = 140) {
  const range = days <= 30 ? "1mo" : days <= 90 ? "3mo" : days <= 180 ? "6mo" : "1y";
  const data = await yfFetch(`${YF_BASE}/v8/finance/chart/${ticker}?interval=1d&range=${range}`);
  const result = data?.chart?.result?.[0];
  if (!result) return null;
  const { open, high, low, close, volume } = result.indicators.quote[0];
  const timestamps = result.timestamp;
  const bars = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (close[i] == null) continue;
    bars.push({ date: new Date(timestamps[i] * 1000).toISOString().split("T")[0], open: open[i] ?? close[i], high: high[i] ?? close[i], low: low[i] ?? close[i], close: close[i], volume: volume[i] ?? 0 });
  }
  return bars;
}

async function pooled(items, limit, fn) {
  const results = new Array(items.length); let idx = 0;
  async function worker() { while (idx < items.length) { const i = idx++; try { results[i] = await fn(items[i], i); } catch { results[i] = null; } } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function fetchDailyBars(ticker, days = 60) {
  const range = days <= 30 ? "1mo" : days <= 90 ? "3mo" : "6mo";
  const data = await yfFetch(`${YF_BASE}/v8/finance/chart/${ticker}?interval=1d&range=${range}`);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${ticker}`);
  const { close, volume } = result.indicators.quote[0];
  return { close, volume, timestamps: result.timestamp };
}

export async function fetchQuote(ticker) {
  const url = `${YF_BASE}/v7/finance/quote?symbols=${ticker}&fields=regularMarketPrice,regularMarketVolume,fiftyDayAverage,regularMarketDayHigh,regularMarketDayLow,shortName`;
  const data = await yfFetch(url);
  const q = data?.quoteResponse?.result?.[0];
  if (!q) throw new Error(`No quote data for ${ticker}`);
  return { ticker, name: q.shortName ?? ticker, price: q.regularMarketPrice, volume: q.regularMarketVolume, sma50: q.fiftyDayAverage, dayHigh: q.regularMarketDayHigh, dayLow: q.regularMarketDayLow };
}

export async function fetchQuoteBatch(tickers) {
  const out = []; const CHUNK = 80;
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const chunk = tickers.slice(i, i + CHUNK).join(",");
    const data = await yfFetch(`${YF_BASE}/v7/finance/quote?symbols=${chunk}&fields=regularMarketPrice,regularMarketVolume,fiftyDayAverage,regularMarketDayHigh,regularMarketDayLow,shortName`);
    out.push(...(data?.quoteResponse?.result ?? []).map((q) => ({ ticker: q.symbol, name: q.shortName ?? q.symbol, price: q.regularMarketPrice, volume: q.regularMarketVolume, sma50: q.fiftyDayAverage, dayHigh: q.regularMarketDayHigh, dayLow: q.regularMarketDayLow })));
    if (i + CHUNK < tickers.length) await sleep(120);
  }
  return out;
}

export async function computeSectorFlow(etfTicker) {
  const { close, volume } = await fetchDailyBars(etfTicker, 35);
  const w = close.slice(-30), vw = volume.slice(-30);
  const pc = (w.at(-1) - w[0]) / w[0];
  return { priceChange: pc, volChange: (vw.at(-1) - vw[0]) / vw[0], flowProxy: (w.at(-1) * (vw.reduce((a,b)=>a+b,0)/vw.length)) / 1e9, trending: pc > 0 };
}

export async function fetchSectorETFData(etfTickers) {
  const map = new Map();
  const bars = await pooled(etfTickers, 6, (etf) => fetchOHLCV(etf, 45));
  etfTickers.forEach((etf, i) => { if (bars[i]?.length > 0) map.set(etf, bars[i]); });
  return map;
}

export async function fetchBatchHistorical(tickers) {
  const map = new Map();
  const results = await pooled(tickers, 8, (ticker) => fetchOHLCV(ticker, 140));
  tickers.forEach((ticker, i) => { if (results[i]?.length > 0) map.set(ticker, results[i]); });
  return map;
}
