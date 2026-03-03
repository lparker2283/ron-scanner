/**
 * Sector ETF mapping and fund flow proxy calculation.
 * Uses ETF price trend + volume as a proxy for sector fund flows.
 */

export const SECTOR_ETFS = {
  Technology: "XLK",
  "Health Care": "XLV",
  Financials: "XLF",
  "Consumer Discretionary": "XLY",
  "Communication Services": "XLC",
  Industrials: "XLI",
  "Consumer Staples": "XLP",
  Energy: "XLE",
  Utilities: "XLU",
  "Real Estate": "XLRE",
  Materials: "XLB",
};

// Map tickers to GICS sectors (S&P 500)
// This is a simplified mapping — in production you'd use a full dataset
export const SECTOR_MAP = {
  AAPL: "Technology", MSFT: "Technology", NVDA: "Technology", AVGO: "Technology",
  ORCL: "Technology", CRM: "Technology", AMD: "Technology", ADBE: "Technology",
  CSCO: "Technology", ACN: "Technology", IBM: "Technology", INTU: "Technology",
  TXN: "Technology", QCOM: "Technology", AMAT: "Technology", NOW: "Technology",
  PANW: "Technology", ADI: "Technology", MU: "Technology", LRCX: "Technology",
  SNPS: "Technology", CDNS: "Technology", KLAC: "Technology", CRWD: "Technology",
  MCHP: "Technology", FTNT: "Technology", MSI: "Technology", NXPI: "Technology",
  APH: "Technology", ROP: "Technology", PLTR: "Technology", DELL: "Technology",
  INTC: "Technology",

  UNH: "Health Care", JNJ: "Health Care", LLY: "Health Care", ABBV: "Health Care",
  MRK: "Health Care", TMO: "Health Care", ABT: "Health Care", DHR: "Health Care",
  PFE: "Health Care", AMGN: "Health Care", BMY: "Health Care", ISRG: "Health Care",
  SYK: "Health Care", MDT: "Health Care", GILD: "Health Care", VRTX: "Health Care",
  ELV: "Health Care", CI: "Health Care", BSX: "Health Care", ZTS: "Health Care",
  REGN: "Health Care", HCA: "Health Care", EW: "Health Care", BDX: "Health Care",
  DXCM: "Health Care", IDXX: "Health Care", A: "Health Care", IQV: "Health Care",
  MTD: "Health Care", HOLX: "Health Care",

  JPM: "Financials", V: "Financials", MA: "Financials", BAC: "Financials",
  WFC: "Financials", GS: "Financials", MS: "Financials", BLK: "Financials",
  SPGI: "Financials", AXP: "Financials", C: "Financials", SCHW: "Financials",
  CB: "Financials", MMC: "Financials", PGR: "Financials", ICE: "Financials",
  AON: "Financials", CME: "Financials", MCO: "Financials", AIG: "Financials",
  MET: "Financials", USB: "Financials", TFC: "Financials", PNC: "Financials",
  AJG: "Financials", PYPL: "Financials", COF: "Financials", AFL: "Financials",
  BK: "Financials", TRV: "Financials",

  AMZN: "Consumer Discretionary", TSLA: "Consumer Discretionary",
  HD: "Consumer Discretionary", MCD: "Consumer Discretionary",
  NKE: "Consumer Discretionary", LOW: "Consumer Discretionary",
  SBUX: "Consumer Discretionary", TJX: "Consumer Discretionary",
  BKNG: "Consumer Discretionary", CMG: "Consumer Discretionary",
  ABNB: "Consumer Discretionary", MAR: "Consumer Discretionary",
  ORLY: "Consumer Discretionary", AZO: "Consumer Discretionary",
  DHI: "Consumer Discretionary", LEN: "Consumer Discretionary",
  GM: "Consumer Discretionary", F: "Consumer Discretionary",
  ROST: "Consumer Discretionary", YUM: "Consumer Discretionary",
  DARDEN: "Consumer Discretionary", EBAY: "Consumer Discretionary",
  POOL: "Consumer Discretionary", GPC: "Consumer Discretionary",

  META: "Communication Services", GOOGL: "Communication Services",
  GOOG: "Communication Services", NFLX: "Communication Services",
  DIS: "Communication Services", CMCSA: "Communication Services",
  VZ: "Communication Services", T: "Communication Services",
  TMUS: "Communication Services", CHTR: "Communication Services",
  EA: "Communication Services", TTWO: "Communication Services",
  MTCH: "Communication Services", WBD: "Communication Services",
  OMC: "Communication Services", IPG: "Communication Services",
  PARA: "Communication Services", LYV: "Communication Services",
  NWSA: "Communication Services", NWS: "Communication Services",

  GE: "Industrials", CAT: "Industrials", RTX: "Industrials",
  UNP: "Industrials", HON: "Industrials", BA: "Industrials",
  DE: "Industrials", UPS: "Industrials", LMT: "Industrials",
  ADP: "Industrials", NOC: "Industrials", GD: "Industrials",
  ITW: "Industrials", WM: "Industrials", ETN: "Industrials",
  EMR: "Industrials", FDX: "Industrials", CSX: "Industrials",
  NSC: "Industrials", TT: "Industrials", PCAR: "Industrials",
  CARR: "Industrials", CTAS: "Industrials", PAYX: "Industrials",
  RSG: "Industrials", FAST: "Industrials", VRSK: "Industrials",
  PWR: "Industrials", AME: "Industrials", ODFL: "Industrials",

  PG: "Consumer Staples", KO: "Consumer Staples", PEP: "Consumer Staples",
  COST: "Consumer Staples", WMT: "Consumer Staples", PM: "Consumer Staples",
  MO: "Consumer Staples", MDLZ: "Consumer Staples", CL: "Consumer Staples",
  EL: "Consumer Staples", ADM: "Consumer Staples", GIS: "Consumer Staples",
  SYY: "Consumer Staples", KMB: "Consumer Staples", HSY: "Consumer Staples",
  KHC: "Consumer Staples", STZ: "Consumer Staples", KR: "Consumer Staples",
  MKC: "Consumer Staples", CHD: "Consumer Staples", CLX: "Consumer Staples",
  SJM: "Consumer Staples", K: "Consumer Staples", CAG: "Consumer Staples",
  TSN: "Consumer Staples", HRL: "Consumer Staples", CPB: "Consumer Staples",
  BG: "Consumer Staples",

  XOM: "Energy", CVX: "Energy", COP: "Energy", EOG: "Energy",
  SLB: "Energy", MPC: "Energy", PSX: "Energy", VLO: "Energy",
  PXD: "Energy", OXY: "Energy", WMB: "Energy", DVN: "Energy",
  HES: "Energy", HAL: "Energy", KMI: "Energy", BKR: "Energy",
  FANG: "Energy", CTRA: "Energy", OKE: "Energy", TRGP: "Energy",

  NEE: "Utilities", DUK: "Utilities", SO: "Utilities", D: "Utilities",
  AEP: "Utilities", SRE: "Utilities", EXC: "Utilities", XEL: "Utilities",
  ED: "Utilities", PCG: "Utilities", WEC: "Utilities", ES: "Utilities",
  AWK: "Utilities", EIX: "Utilities", DTE: "Utilities", AEE: "Utilities",
  ETR: "Utilities", PPL: "Utilities", FE: "Utilities", CMS: "Utilities",
  CNP: "Utilities", ATO: "Utilities", EVRG: "Utilities", NI: "Utilities",
  LNT: "Utilities", PNW: "Utilities", NRG: "Utilities", CEG: "Utilities",

  AMT: "Real Estate", PLD: "Real Estate", CCI: "Real Estate",
  EQIX: "Real Estate", PSA: "Real Estate", SPG: "Real Estate",
  O: "Real Estate", WELL: "Real Estate", DLR: "Real Estate",
  VICI: "Real Estate", AVB: "Real Estate", EQR: "Real Estate",
  ARE: "Real Estate", MAA: "Real Estate", UDR: "Real Estate",
  ESS: "Real Estate", VTR: "Real Estate", HST: "Real Estate",
  KIM: "Real Estate", REG: "Real Estate", CPT: "Real Estate",
  PEAK: "Real Estate", BXP: "Real Estate", IRM: "Real Estate",
  SBAC: "Real Estate", INVH: "Real Estate",

  APD: "Materials", LIN: "Materials", SHW: "Materials",
  ECL: "Materials", FCX: "Materials", NEM: "Materials",
  DOW: "Materials", NUE: "Materials", VMC: "Materials",
  MLM: "Materials", PPG: "Materials", DD: "Materials",
  EMN: "Materials", IFF: "Materials", ALB: "Materials",
  CE: "Materials", CF: "Materials", MOS: "Materials",
  FMC: "Materials", IP: "Materials", PKG: "Materials",
  WRK: "Materials", SEE: "Materials", AVY: "Materials",
  BALL: "Materials", AMCR: "Materials",
};

export function getSector(ticker) {
  return SECTOR_MAP[ticker] || null;
}

export function getAllTickers() {
  return Object.keys(SECTOR_MAP);
}

export function getTickersInSector(sector) {
  return Object.entries(SECTOR_MAP)
    .filter(([, s]) => s === sector)
    .map(([ticker]) => ticker);
}

/**
 * Calculate sector flow proxy from ETF data.
 * Positive flow = ETF price trending up with increasing volume over 30 days.
 * Returns { sector, etf, flow: number, trending: boolean }
 */
export function calculateSectorFlow(etfData) {
  if (!etfData || etfData.length < 30) {
    return { flow: 0, trending: false };
  }

  const recent = etfData.slice(-30);
  const firstHalf = recent.slice(0, 15);
  const secondHalf = recent.slice(15);

  const avgPriceFirst =
    firstHalf.reduce((s, d) => s + d.close, 0) / firstHalf.length;
  const avgPriceSecond =
    secondHalf.reduce((s, d) => s + d.close, 0) / secondHalf.length;

  const avgVolFirst =
    firstHalf.reduce((s, d) => s + d.volume, 0) / firstHalf.length;
  const avgVolSecond =
    secondHalf.reduce((s, d) => s + d.volume, 0) / secondHalf.length;

  const priceChange = (avgPriceSecond - avgPriceFirst) / avgPriceFirst;
  const volChange = (avgVolSecond - avgVolFirst) / avgVolFirst;

  // Estimate flow in billions (rough proxy using volume * price trend)
  const avgDailyDollarVol =
    secondHalf.reduce((s, d) => s + d.close * d.volume, 0) / secondHalf.length;
  const flowEstimate = (priceChange * avgDailyDollarVol * 30) / 1e9;

  return {
    flow: Math.round(flowEstimate * 10) / 10,
    trending: priceChange > 0 && volChange > -0.1,
    priceChange: Math.round(priceChange * 1000) / 10,
    volChange: Math.round(volChange * 1000) / 10,
  };
}
