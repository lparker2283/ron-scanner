const FMP_BASE = "https://financialmodelingprep.com/api/v3";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function apiKey() {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY environment variable is not set");
  return key;
}

async function fmpFetch(path) {
  const url = `${FMP_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP HTTP ${res.status} for ${path}`);
  return res.json();
}

/**
 * Fetch daily OHLCV data for a ticker via FMP historical-price-full.
 * Returns [{ date, open, high, low, close, volume }] sorted oldest→newest, or null.
 */
export async function fetchHistoricalData(ticker, months = 10) {
  try {
    const timeseries = Math.ceil(months * 22); // ~22 trading days/month
    const json = await fmpFetch(
      `/historical-price-full/${ticker}?timeseries=${timeseries}&apikey=${apiKey()}`
    );

    if (!json?.historical?.length) return null;

    // FMP returns newest-first; reverse to oldest-first
    return json.historical
      .slice()
      .reverse()
      .map((d) => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.adjClose ?? d.close,
        volume: d.volume,
      }))
      .filter((d) => d.close != null && d.volume != null);
  } catch (err) {
    console.error(
      `Failed to fetch historical data for ${ticker}:`,
      err.message
    );
    return null;
  }
}

/**
 * Fetch current quote info for a ticker.
 */
export async function fetchQuote(ticker) {
  try {
    const json = await fmpFetch(`/quote/${ticker}?apikey=${apiKey()}`);
    const q = Array.isArray(json) ? json[0] : null;
    if (!q) return null;

    return {
      price: q.price,
      name: q.name || ticker,
      change: q.changesPercentage,
    };
  } catch (err) {
    console.error(`Failed to fetch quote for ${ticker}:`, err.message);
    return null;
  }
}

/**
 * Batch fetch historical data with rate limiting.
 * Returns Map<ticker, dailyData[]>
 */
export async function fetchBatchHistorical(tickers, delayMs = 200) {
  const results = new Map();

  for (const ticker of tickers) {
    const data = await fetchHistoricalData(ticker);
    if (data) {
      results.set(ticker, data);
    }
    await delay(delayMs);
  }

  return results;
}

/**
 * Fetch sector ETF data for all sector ETFs.
 */
export async function fetchSectorETFData(etfTickers, months = 2) {
  const results = new Map();

  for (const ticker of etfTickers) {
    const data = await fetchHistoricalData(ticker, months);
    if (data) {
      results.set(ticker, data);
    }
    await delay(50);
  }

  return results;
}
