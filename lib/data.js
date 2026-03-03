import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({
  suppressNotices: ["ripHistorical", "yahooSurvey"],
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const moduleOptions = { validateResult: false };

/**
 * Fetch daily OHLCV data for a ticker via yahoo-finance2 chart().
 * Returns [{ date, open, high, low, close, volume }] sorted oldest→newest, or null.
 */
export async function fetchHistoricalData(ticker, months = 10) {
  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - months);

    const result = await yf.chart(
      ticker,
      { period1, period2: new Date(), interval: "1d" },
      moduleOptions
    );

    if (!result?.quotes?.length) return null;

    return result.quotes
      .map((d) => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.adjclose ?? d.close,
        volume: d.volume,
      }))
      .filter((d) => d.close != null && d.volume != null);
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
    const result = await yf.quote(ticker, {}, moduleOptions);
    if (!result) return null;

    return {
      price: result.regularMarketPrice,
      name: result.longName || result.shortName || ticker,
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
