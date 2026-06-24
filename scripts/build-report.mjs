// scripts/build-report.mjs
// Reads the latest TradingView-fed scan from Redis and writes a markdown
// report to reports/<date>.md — matching the existing report format.
// Run by the Cowork scheduled task after the TradingView alerts land.
import { Redis } from "@upstash/redis";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, "../reports");

const redis = Redis.fromEnv();
const data = await redis.get("latest-scan");

if (!data || !data.picks || data.picks.length === 0) {
  console.error("NO_DATA: no picks in latest-scan. Did TradingView alerts fire today?");
  process.exit(2);
}

const date = data.date;
const picks = data.picks;
const t1 = picks.filter((p) => p.tier === 1).length;
const t2 = picks.filter((p) => p.tier === 2).length;
const sectors = Object.entries(data.sectorFlows || {})
  .filter(([, f]) => f.trending)
  .map(([s]) => s);

const yes = (b) => (b ? "YES" : "NO");
const lines = [];
lines.push(`# RON Scanner — ${date}`, "");
lines.push(`**Run date:** ${date}`);
lines.push(`**Scan time:** ${data.scanTime || "—"}`);
lines.push(`**Source:** ${data.source || "tradingview"} (alert webhook)`);
lines.push(`**Picks found:** ${t2} (Tier 2) · ${t1} (Tier 1)`, "");
lines.push("---", "");

if (sectors.length) {
  lines.push("## Positive-flow sectors", "");
  lines.push(sectors.join(" · "), "");
  lines.push("---", "");
}

lines.push("## Ranked Picks", "");
picks.forEach((p, i) => {
  const cr = Object.fromEntries((p.criteria || []).map((c) => [c.name, c]));
  lines.push(`### ${i + 1}. ${p.ticker} · ${p.sector || "—"} · Tier ${p.tier} · ${p.metCount}/5`, "");
  lines.push("| Price | Stop-Loss | Vol Delta |", "|---|---|---|");
  lines.push(`| $${p.price ?? "—"} | $${p.stopLoss ?? "—"} | ${p.volumeChange >= 0 ? "+" : ""}${p.volumeChange ?? 0}% |`, "");
  lines.push(`- **Sector Flow** ${yes(cr["Sector Flow"]?.met)}`);
  lines.push(`- **Consolidation Breakout** ${yes(cr["Consolidation"]?.met)} — Vol ${cr["Consolidation"]?.value ?? "—"}%`);
  lines.push(`- **SMA Slope** ${yes(cr["SMA Slope"]?.met)} — 50-SMA ${cr["SMA Slope"]?.value ?? "—"}%`);
  lines.push(`- **Cutler RSI** ${yes(cr["Cutler RSI"]?.met)} — RSI ${cr["Cutler RSI"]?.value ?? "—"}`);
  lines.push(`- **Higher Highs** ${yes(cr["Higher Highs"]?.met)} — ${cr["Higher Highs"]?.value ?? 0} higher high(s)`, "");
  lines.push("---", "");
});

lines.push("*Data source: TradingView (Pine alert webhook). Scan via RON Scanner — lparker2283/ron-scanner.*", "");

// Leave a slot for the Cowork analyst to fill in (see tradingview/README.md).
lines.splice(lines.indexOf("## Ranked Picks"), 0, "## Market Read", "", "<!-- ANALYST: replace this line with your market summary -->", "", "---", "");

mkdirSync(REPORTS_DIR, { recursive: true });
const out = resolve(REPORTS_DIR, `${date}.md`);
writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${out} — ${picks.length} picks (${t1} Tier 1, ${t2} Tier 2).`);

// Emit structured picks so the Cowork analyst task can reason over them.
console.log("PICKS_JSON=" + JSON.stringify({ date, t1, t2, sectors, picks }));
