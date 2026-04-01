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
  const from60 = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);

  // Test 1: XLK (working sector) — 7 days
  try {
    const json = await massiveFetch(
      `/v2/aggs/ticker/XLK/range/1/day/${from}/${to}?adjusted=true&sort=asc`,
      key
    );
    results.XLK_7d = { count: json.resultsCount ?? 0, status: json.status };
  } catch (err) {
    results.XLK_7d = { error: err.message };
  }

  // Test 2: XLI (zero-flow sector) — 7 days
  try {
    const json = await massiveFetch(
      `/v2/aggs/ticker/XLI/range/1/day/${from}/${to}?adjusted=true&sort=asc`,
      key
    );
    results.XLI_7d = { count: json.resultsCount ?? 0, status: json.status };
  } catch (err) {
    results.XLI_7d = { error: err.message };
  }

  // Test 3: XLI — 60 days (what the scanner actually requests for sector ETFs)
  try {
    const json = await massiveFetch(
      `/v2/aggs/ticker/XLI/range/1/day/${from60}/${to}?adjusted=true&sort=asc&limit=50000`,
      key
    );
    results.XLI_60d = { count: json.resultsCount ?? 0, status: json.status };
  } catch (err) {
    results.XLI_60d = { error: err.message };
  }

  // Test 4: XLK — 60 days
  try {
    const json = await massiveFetch(
      `/v2/aggs/ticker/XLK/range/1/day/${from60}/${to}?adjusted=true&sort=asc&limit=50000`,
      key
    );
    results.XLK_60d = { count: json.resultsCount ?? 0, status: json.status };
  } catch (err) {
    results.XLK_60d = { error: err.message };
  }

  return NextResponse.json(results);
}
