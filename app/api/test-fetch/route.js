import { NextResponse } from "next/server";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

async function fmpFetch(path) {
  const res = await fetch(`${FMP_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function GET() {
  const key = process.env.FMP_API_KEY;
  const results = { fmpKeySet: !!key };

  // Test 1: single ticker
  try {
    const json = await fmpFetch(`/historical-price-full/XLK?timeseries=5&apikey=${key}`);
    results.singleTicker = {
      ok: !!json?.historical?.length,
      count: json?.historical?.length ?? 0,
      keys: Object.keys(json ?? {}),
    };
  } catch (err) {
    results.singleTicker = { ok: false, error: err.message };
  }

  // Test 2: batch tickers
  try {
    const json = await fmpFetch(`/historical-price-full/XLK,XLV?timeseries=5&apikey=${key}`);
    results.batchTickers = {
      ok: !!(json?.historicalStockList?.length || json?.historical?.length),
      keys: Object.keys(json ?? {}),
      listLength: json?.historicalStockList?.length ?? "n/a",
    };
  } catch (err) {
    results.batchTickers = { ok: false, error: err.message };
  }

  return NextResponse.json(results);
}
