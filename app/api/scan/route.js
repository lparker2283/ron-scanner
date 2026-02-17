import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".scan-data");

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

async function saveResult(date, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${date}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

async function loadLatestResult() {
  try {
    await ensureDataDir();
    const { readdir } = await import("fs/promises");
    const files = await readdir(DATA_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort().reverse();
    if (jsonFiles.length === 0) return null;
    const content = await readFile(path.join(DATA_DIR, jsonFiles[0]), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// GET — return latest scan results
export async function GET() {
  const data = await loadLatestResult();
  if (!data) {
    return NextResponse.json({ error: "No scan data yet" }, { status: 404 });
  }
  return NextResponse.json(data);
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
    await saveResult(result.date, result);
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
