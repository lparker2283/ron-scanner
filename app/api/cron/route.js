import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = "/tmp/.scan-data";

// GET — called by Vercel cron (crons always use GET)
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting daily scan...");
    await mkdir(DATA_DIR, { recursive: true });
    const result = await runScan();
    const filePath = path.join(DATA_DIR, `${result.date}.json`);
    await writeFile(filePath, JSON.stringify(result, null, 2));
    console.log(`[Cron] Scan complete. ${result.picks.length} picks saved.`);
    return NextResponse.json({ ok: true, date: result.date, picks: result.picks.length });
  } catch (err) {
    console.error("[Cron] Scan failed:", err);
    return NextResponse.json({ error: "Scan failed", message: err.message }, { status: 500 });
  }
}
