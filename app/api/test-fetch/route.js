import { NextResponse } from "next/server";
import { fetchHistoricalData, fetchQuote } from "@/lib/data";

export async function GET() {
  const ticker = "XLK";
  const results = { ticker, fmpKeySet: !!process.env.FMP_API_KEY };

  try {
    const data = await fetchHistoricalData(ticker, 2);
    results.historical = {
      ok: !!data,
      count: data?.length ?? 0,
      sample: data?.slice(-3),
    };
  } catch (err) {
    results.historical = { ok: false, error: err.message };
  }

  try {
    const q = await fetchQuote(ticker);
    results.quote = { ok: !!q, data: q };
  } catch (err) {
    results.quote = { ok: false, error: err.message };
  }

  return NextResponse.json(results);
}
