import { NextResponse } from "next/server";

const MASSIVE_BASE = "https://api.massive.com";

async function massiveFetch(path, key) {
  const separator = path.includes("?") ? "&" : "?";
  const res = await fetch(`${MASSIVE_BASE}${path}${separator}apiKey=${key}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function GET() {
  const key = process.env.MASSIVE_API_KEY;
  const results = { massiveKeySet: !!key };

  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  // Test 1: single ticker historical bars
  try {
    const json = await massiveFetch(
      `/v2/aggs/ticker/XLK/range/1/day/${from}/${to}?adjusted=true&sort=asc`,
      key
    );
    results.singleTicker = {
      ok: json.resultsCount > 0,
      count: json.resultsCount ?? 0,
      status: json.status,
    };
  } catch (err) {
    results.singleTicker = { ok: false, error: err.message };
  }

  // Test 2: quote via recent aggs (avoids snapshot tier requirement)
  try {
    const json = await massiveFetch(
      `/v2/aggs/ticker/XLK/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=2`,
      key
    );
    const bars = json.results ?? [];
    const latest = bars[bars.length - 1];
    results.quote = {
      ok: !!latest,
      price: latest?.c ?? null,
      bars: bars.length,
      status: json.status,
    };
  } catch (err) {
    results.quote = { ok: false, error: err.message };
  }

  return NextResponse.json(results);
}
