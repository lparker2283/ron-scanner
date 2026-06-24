import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KV_KEY = "latest-scan"; // shape the Dashboard already reads

// TradingView fires one alert per qualifying symbol. We accumulate them into
// the current day's pick list, dedup by ticker (latest wins), and rebuild the
// `latest-scan` payload so the existing dashboard keeps working unchanged.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Auth — TradingView can't send headers, so the secret travels in the payload.
  const expected = process.env.TV_WEBHOOK_SECRET;
  if (expected && body.secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = body.time || new Date().toISOString().split("T")[0];

  // Normalize one alert into a pick (matches runScan's pick shape closely).
  const c = body.criteria || {};
  const v = body.values || {};
  const d = body.details || {};
  const pick = {
    ticker: body.ticker,
    name: body.ticker,
    sector: body.sector || null,
    sectorETF: body.sectorETF || null,
    price: body.price ?? null,
    stopLoss: body.stopLoss ?? null,
    tier: body.tier ?? null,
    metCount: body.metCount ?? 0,
    volumeChange: v.volChangePct ?? 0,
    criteria: [
      { name: "Sector Flow", met: !!c.sectorFlow, value: body.sectorFlowB, detail: d.sectorFlow },
      { name: "Consolidation", met: !!c.consolidation, value: v.volChangePct, detail: d.consolidation },
      { name: "SMA Slope", met: !!c.smaSlope, value: v.smaSlopePct, detail: d.smaSlope },
      { name: "Cutler RSI", met: !!c.cutlerRSI, value: v.rsi, detail: d.cutlerRSI },
      { name: "Higher Highs", met: !!c.higherHighs, value: v.higherHighCount, detail: d.higherHighs, doubleConfirmed: !!body.doubleConfirmed },
    ],
  };

  // Load the existing payload; reset it if it's from a previous day.
  let payload = await redis.get(KV_KEY);
  if (!payload || payload.date !== date) {
    payload = { date, scanTime: null, source: "tradingview", sectorFlows: {}, picks: [] };
  }

  // Upsert by ticker.
  payload.picks = payload.picks.filter((p) => p.ticker !== pick.ticker);
  payload.picks.push(pick);

  // Record which sectors produced picks (partial flow map from alerts).
  if (pick.sector) {
    payload.sectorFlows[pick.sector] = {
      etf: pick.sectorETF,
      trending: !!c.sectorFlow,
    };
  }

  // Sort: Tier 1 first, then by volume change desc; keep top 10.
  payload.picks.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return (b.volumeChange || 0) - (a.volumeChange || 0);
  });
  payload.picks = payload.picks.slice(0, 10);
  payload.totalScanned = payload.picks.length;
  payload.scanTime = new Date().toISOString();

  await redis.set(KV_KEY, payload);

  return NextResponse.json({ ok: true, ticker: pick.ticker, tier: pick.tier, totalPicks: payload.picks.length });
}
