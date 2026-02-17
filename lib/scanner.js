import {
  SECTOR_ETFS,
  getSector,
  getAllTickers,
  getTickersInSector,
  calculateSectorFlow,
} from "./sectors.js";
import { fetchBatchHistorical, fetchSectorETFData, fetchQuote } from "./data.js";
import { evaluateStock } from "./criteria.js";

/**
 * Run the full daily scan.
 * 1. Fetch sector ETF data and determine which sectors have positive flow
 * 2. For stocks in positive-flow sectors, fetch historical data
 * 3. Evaluate all 5 criteria
 * 4. Score, tier, sort, return top 10
 */
export async function runScan() {
  console.log("[Scanner] Starting daily scan...");
  const startTime = Date.now();

  // Step 1: Fetch sector ETF data
  console.log("[Scanner] Fetching sector ETF data...");
  const etfTickers = Object.values(SECTOR_ETFS);
  const etfData = await fetchSectorETFData(etfTickers);

  // Calculate sector flows
  const sectorFlows = {};
  for (const [sector, etf] of Object.entries(SECTOR_ETFS)) {
    const data = etfData.get(etf);
    const flow = calculateSectorFlow(data);
    sectorFlows[sector] = { etf, ...flow };
  }

  console.log("[Scanner] Sector flows calculated:");
  for (const [sector, flow] of Object.entries(sectorFlows)) {
    console.log(
      `  ${sector}: ${flow.trending ? "+" : "-"} $${flow.flow}B`
    );
  }

  // Step 2: Get tickers in positive-flow sectors
  const positiveSectors = Object.entries(sectorFlows)
    .filter(([, flow]) => flow.trending)
    .map(([sector]) => sector);

  console.log(
    `[Scanner] Positive sectors: ${positiveSectors.join(", ") || "None"}`
  );

  const tickersToScan = [];
  for (const sector of positiveSectors) {
    tickersToScan.push(...getTickersInSector(sector));
  }

  console.log(`[Scanner] Scanning ${tickersToScan.length} stocks...`);

  // Step 3: Fetch historical data and evaluate
  const historicalData = await fetchBatchHistorical(tickersToScan, 200);

  const results = [];
  for (const ticker of tickersToScan) {
    const dailyData = historicalData.get(ticker);
    if (!dailyData || dailyData.length < 60) continue;

    const sector = getSector(ticker);
    const sectorFlowData = sectorFlows[sector];
    const evaluation = evaluateStock(dailyData, sectorFlowData);

    // Only include tier 1 or tier 2
    if (!evaluation.tier) continue;

    // Get quote for current price
    const quote = await fetchQuote(ticker);
    const price = quote?.price || dailyData[dailyData.length - 1].close;
    const name = quote?.name || ticker;

    // Calculate volume change for sorting
    const volCriterion = evaluation.criteria.find(
      (c) => c.name === "Consolidation"
    );
    const volumeChange = volCriterion?.value || 0;

    results.push({
      ticker,
      name,
      sector,
      price: Math.round(price * 100) / 100,
      stopLoss: Math.round(price * 0.94 * 100) / 100,
      tier: evaluation.tier,
      metCount: evaluation.metCount,
      criteria: evaluation.criteria,
      volumeChange,
      dailyData: dailyData.slice(-130).map((d) => ({
        date: d.date,
        close: d.close,
        volume: d.volume,
      })),
    });
  }

  // Step 4: Sort — Tier 1 first, then by volume change descending
  results.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.volumeChange - a.volumeChange;
  });

  // Take top 10
  const topPicks = results.slice(0, 10);

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(
    `[Scanner] Scan complete in ${elapsed}s. Found ${topPicks.length} picks.`
  );

  return {
    date: new Date().toISOString().split("T")[0],
    scanTime: new Date().toISOString(),
    elapsed,
    sectorFlows,
    picks: topPicks,
    totalScanned: tickersToScan.length,
  };
}
