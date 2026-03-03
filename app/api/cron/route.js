import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import { kv } from "@vercel/kv";

const KV_KEY = "latest-scan";

// GET — called by Vercel cron (crons always use GET)
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting daily scan...");
    const result = await runScan();
    await kv.set(KV_KEY, result);
    console.log(`[Cron] Scan complete. ${result.picks.length} picks saved.`);
    return NextResponse.json({ ok: true, date: result.date, picks: result.picks.length });
  } catch (err) {
    console.error("[Cron] Scan failed:", err);
    return NextResponse.json({ error: "Scan failed", message: err.message }, { status: 500 });
  }
}
