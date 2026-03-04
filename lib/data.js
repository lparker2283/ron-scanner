const YF_BASE = "https://query1.finance.yahoo.com";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function yfFetch(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} for ${url}`);
  return res.json();
}

/**
 * Fetch daily OHLCV data for a ticker via Yahoo Finance v8 chart API.
 * Returns [{ date, open, high, low, close, volume }] sorted oldest→newest, or null.
 */
export async function fetchHistoricalData(ticker, months = 10) {
  try {
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = Math.floor(
      (Date.now() - months * 30 * 24 * 60 * 60 * 1000) / 1000
    );

    const url = `${YF_BASE}/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&includeAdjustedClose=true`;
    const json = await yfFetch(url);

    const result = json?.chart?.result?.[0];
    if (!result?.timestamp?.length) return null;

    const { timestamp, indicators } = result;
    const quotes = indicators?.quote?.[0] ?? {};
    const adjclose = indicators?.adjclose?.[0]?.adjclose ?? [];

    return timestamp
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString(),
        open: quotes.open?.[i],
        high: quotes.high?.[i],
        low: quotes.low?.[i],
        close: adjclose[i] ?? quotes.close?.[i],
        volume: quotes.volume?.[i],
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
    const url = `${YF_BASE}/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const json = await yfFetch(url);
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    return {
      price: meta.regularMarketPrice,
      name: meta.longName || meta.shortName || ticker,
      change: meta.regularMarketChangePercent,
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
    await delay(200);
  }

  return results;
}
