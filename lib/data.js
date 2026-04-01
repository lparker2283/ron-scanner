const MASSIVE_BASE = "https://api.massive.com";
const CONCURRENCY = 5;

function apiKey() {
  const key = process.env.MASSIVE_API_KEY;
  if (!key) throw new Error("MASSIVE_API_KEY environment variable is not set");
  return key;
}

async function massiveFetch(path) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${MASSIVE_BASE}${path}${separator}apiKey=${apiKey()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Massive HTTP ${res.status} for ${path}`);
  return res.json();
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function parseAggregates(results) {
  if (!results?.length) return null;
  return results
    .map((bar) => ({
      date: new Date(bar.t).toISOString().slice(0, 10),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }))
    .filter((d) => d.close != null && d.volume != null);
}

/**
 * Fetch historical daily OHLCV for a single ticker from Massive (formerly Polygon).
 * Returns [{ date, open, high, low, close, volume }] or null.
 */
export async function fetchHistoricalData(ticker, months = 10) {
  try {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - months);

    const json = await massiveFetch(
      `/v2/aggs/ticker/${ticker}/range/1/day/${formatDate(from)}/${formatDate(to)}?adjusted=true&sort=asc&limit=50000`
    );
    return parseAggregates(json.results);
  } catch (err) {
    console.error(`Failed to fetch historical data for ${ticker}:`, err.message);
    return null;
  }
}

/**
 * Fetch current quote info for a ticker using recent daily aggregates.
 * Uses the aggs endpoint (works on all plan tiers) instead of snapshot.
 */
export async function fetchQuote(ticker) {
  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7); // look back a week to ensure we get 2 trading days

    const json = await massiveFetch(
      `/v2/aggs/ticker/${ticker}/range/1/day/${formatDate(from)}/${formatDate(to)}?adjusted=true&sort=asc&limit=5`
    );
    const bars = json.results;
    if (!bars?.length) return null;

    const latest = bars[bars.length - 1];
    const prev = bars.length >= 2 ? bars[bars.length - 2] : null;
    const change = prev ? ((latest.c - prev.c) / prev.c) * 100 : null;

    return {
      price: latest.c,
      name: ticker,
      change,
    };
  } catch (err) {
    console.error(`Failed to fetch quote for ${ticker}:`, err.message);
    return null;
  }
}

/**
 * Run async tasks with limited concurrency.
 */
async function parallelLimit(tasks, limit) {
  const results = [];
  let i = 0;
  async function next() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, next));
  return results;
}

/**
 * Fetch historical data for multiple tickers in parallel (with concurrency limit).
 * Returns Map<ticker, dailyData[]>
 */
export async function fetchBatchHistorical(tickers, months = 10) {
  const results = new Map();

  const tasks = tickers.map((ticker) => async () => {
    const data = await fetchHistoricalData(ticker, months);
    if (data) results.set(ticker, data);
  });

  await parallelLimit(tasks, CONCURRENCY);
  return results;
}

/**
 * Fetch sector ETF data for all sector ETFs.
 */
export async function fetchSectorETFData(etfTickers, months = 2) {
  return fetchBatchHistorical(etfTickers, months);
}
