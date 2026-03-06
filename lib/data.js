const FMP_BASE = "https://financialmodelingprep.com/api/v3";

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

function parseHistorical(raw) {
  if (!raw?.length) return null;
  return raw
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
}

/**
 * Fetch historical OHLCV for a batch of tickers in a single FMP API call.
 * Returns Map<ticker, dailyData[]>
 */
async function fetchHistoricalBatch(tickers, months) {
  const timeseries = Math.ceil(months * 22);
  const symbols = tickers.join(",");
  const json = await fmpFetch(
    `/historical-price-full/${symbols}?timeseries=${timeseries}&apikey=${apiKey()}`
  );

  const results = new Map();

  // Single ticker returns { symbol, historical: [] }
  // Multiple tickers returns { historicalStockList: [{ symbol, historical: [] }] }
  if (json?.historicalStockList) {
    for (const item of json.historicalStockList) {
      const data = parseHistorical(item.historical);
      if (data) results.set(item.symbol, data);
    }
  } else if (json?.symbol && json?.historical) {
    const data = parseHistorical(json.historical);
    if (data) results.set(json.symbol, data);
  }

  return results;
}

/**
 * Fetch daily OHLCV data for a single ticker.
 * Returns [{ date, open, high, low, close, volume }] or null.
 */
export async function fetchHistoricalData(ticker, months = 10) {
  try {
    const batch = await fetchHistoricalBatch([ticker], months);
    return batch.get(ticker) ?? null;
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

const BATCH_SIZE = 20;

/**
 * Fetch historical data for multiple tickers using FMP batch endpoint.
 * Splits into chunks of BATCH_SIZE to stay within URL length limits.
 * Returns Map<ticker, dailyData[]>
 */
export async function fetchBatchHistorical(tickers, months = 10) {
  const results = new Map();

  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const chunk = tickers.slice(i, i + BATCH_SIZE);
    try {
      const batch = await fetchHistoricalBatch(chunk, months);
      for (const [ticker, data] of batch) {
        results.set(ticker, data);
      }
    } catch (err) {
      console.error(`Batch fetch failed for chunk ${i}:`, err.message);
    }
  }

  return results;
}

/**
 * Fetch sector ETF data for all sector ETFs.
 */
export async function fetchSectorETFData(etfTickers, months = 2) {
  return fetchBatchHistorical(etfTickers, months);
}
