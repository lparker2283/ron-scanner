const MASSIVE_BASE = "https://api.polygon.io/v2";

function apiKey() {
  const key = process.env.MASSIVE_API_KEY;
  if (!key) throw new Error("MASSIVE_API_KEY environment variable is not set");
  return key;
}

async function massiveFetch(path) {
  const url = `${MASSIVE_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Massive HTTP ${res.status} for ${path}`);
  return res.json();
}

/**
 * Fetch daily OHLCV data for a ticker via Massive (Polygon) aggregates.
 * Returns [{ date, open, high, low, close, volume }] sorted oldest→newest, or null.
 */
export async function fetchHistoricalData(ticker, months = 10) {
  try {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const json = await massiveFetch(
      `/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${apiKey()}`
    );

    if (!json?.results?.length) return null;

    return json.results.map((d) => ({
      date: new Date(d.t).toISOString().split("T")[0],
      open: d.o,
      high: d.h,
      low: d.l,
      close: d.c,
      volume: d.v,
    }));
  } catch (err) {
    console.error(`Failed to fetch historical data for ${ticker}:`, err.message);
    return null;
  }
}

/**
 * Fetch current quote info for a ticker.
 */
export async function fetchQuote(ticker) {
  try {
    const json = await massiveFetch(
      `/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey()}`
    );
    const result = json?.results?.[0];
    if (!result) return null;

    return {
      price: result.c,
      name: ticker,
      change: result.c && result.o ? ((result.c - result.o) / result.o) * 100 : 0,
    };
  } catch (err) {
    console.error(`Failed to fetch quote for ${ticker}:`, err.message);
    return null;
  }
}

/**
 * Fetch historical data for multiple tickers in parallel.
 * Returns Map<ticker, dailyData[]>
 */
export async function fetchBatchHistorical(tickers, months = 10) {
  const entries = await Promise.all(
    tickers.map(async (ticker) => {
      const data = await fetchHistoricalData(ticker, months);
      return [ticker, data];
    })
  );

  const results = new Map();
  for (const [ticker, data] of entries) {
    if (data) results.set(ticker, data);
  }
  return results;
}

/**
 * Fetch sector ETF data for all sector ETFs.
 */
export async function fetchSectorETFData(etfTickers, months = 2) {
  return fetchBatchHistorical(etfTickers, months);
}
