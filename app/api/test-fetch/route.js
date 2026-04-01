import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.MASSIVE_API_KEY;
  const results = { massiveKeySet: !!key };

  try {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/XLK/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=100&apiKey=${key}`
    );
    const json = await res.json();

    results.historical = {
      ok: !!json?.results?.length,
      count: json?.results?.length ?? 0,
      status: json?.status,
      sample: json?.results?.slice(-3),
    };
  } catch (err) {
    results.historical = { ok: false, error: err.message };
  }

  return NextResponse.json(results);
}
