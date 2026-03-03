import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import { kv } from "@vercel/kv";

const KV_KEY = "latest-scan";

// GET — return latest scan results
export async function GET() {
  try {
    const data = await kv.get(KV_KEY);
    if (!data) {
      return NextResponse.json({ error: "No scan data yet" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API] Failed to read scan data:", err);
    return NextResponse.json({ error: "Failed to read scan data" }, { status: 500 });
  }
}

// POST — trigger a new scan (called by Vercel cron or manually)
export async function POST(request) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    console.log("[API] Starting scan...");
    const result = await runScan();
    await kv.set(KV_KEY, result);
    console.log(`[API] Scan complete. ${result.picks.length} picks saved.`);
    return NextResponse.json({
      ok: true,
      date: result.date,
      picks: result.picks.length,
    });
  } catch (err) {
    console.error("[API] Scan failed:", err);
    return NextResponse.json(
      { error: "Scan failed", message: err.message },
      { status: 500 }
    );
  }
}
