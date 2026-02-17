import yahooFinance from "yahoo-finance2";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch 6 months of daily OHLCV data for a single ticker.
 */
export async function fetchHistoricalData(ticker, months = 6) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const result = await yahooFinance.chart(ticker, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    if (!result?.quotes?.length) return null;

    return result.quotes
      .filter((q) => q.close != null)
      .map((q) => ({
        date: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }));
  } catch (err) {
    console.error(`Failed to fetch data for ${ticker}:`, err.message);
    return null;
  }
}

/**
 * Fetch quote info (current price, name, etc.) for a ticker.
 */
export async function fetchQuote(ticker) {
  try {
    const result = await yahooFinance.quote(ticker);
    return {
      price: result.regularMarketPrice,
      name: result.shortName || result.longName || ticker,
      change: result.regularMarketChangePercent,
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
