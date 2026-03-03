import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

// Quick diagnostic: fetch one ticker and return raw result or full error
export async function GET() {
  const ticker = "XLK";
  const results = {};

  // Test historical()
  try {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 2);
    const data = await yahooFinance.historical(ticker, {
      period1: start,
      period2: end,
      interval: "1d",
    });
    results.historical = {
      ok: true,
      count: data?.length ?? 0,
      sample: data?.slice(-3).map((d) => ({
        date: d.date,
        close: d.close,
        volume: d.volume,
      })),
    };
  } catch (err) {
    results.historical = { ok: false, error: err.message, stack: err.stack };
  }

  // Test quote()
  try {
    const q = await yahooFinance.quote(ticker);
    results.quote = {
      ok: true,
      price: q?.regularMarketPrice,
      name: q?.shortName,
    };
  } catch (err) {
    results.quote = { ok: false, error: err.message };
  }

  return NextResponse.json(results);
}
