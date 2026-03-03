"use client";

import SectorFlows from "./SectorFlows";
import StockCard from "./StockCard";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard({ data }) {
  const tier1 = data?.picks?.filter((p) => p.tier === 1) || [];
  const tier2 = data?.picks?.filter((p) => p.tier === 2) || [];

  const scanDate = data?.date
    ? new Date(data.date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Date */}
        <p style={styles.date}>{scanDate}</p>

        {/* Greeting */}
        <h1 style={styles.greeting}>
          {getGreeting()} Ron, how&apos;s your coffee today?
        </h1>
        <p style={styles.subGreeting}>
          Lindsey and Owen say hi. ☕ Here are today&apos;s picks:
        </p>

        {/* Sector Flows */}
        <div style={styles.section}>
          <SectorFlows sectorFlows={data?.sectorFlows} />
        </div>

        {/* Tier 1 — Strong Setups */}
        {tier1.length > 0 && (
          <div style={styles.section}>
            <div style={styles.tierHeader}>
              <span style={styles.tierDot} />
              <span style={styles.tierLabel}>Strong Setups</span>
              <span style={styles.tierSub}>All criteria met</span>
            </div>
            <div style={styles.cardList}>
              {tier1.map((stock, i) => (
                <StockCard key={stock.ticker} stock={stock} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Tier 2 — Developing */}
        {tier2.length > 0 && (
          <div style={styles.section}>
            <div style={styles.tierHeader}>
              <span style={{ ...styles.tierDot, background: "var(--gold)" }} />
              <span style={styles.tierLabel}>Developing</span>
              <span style={styles.tierSub}>Watchlist</span>
            </div>
            <div style={styles.cardList}>
              {tier2.map((stock, i) => (
                <StockCard
                  key={stock.ticker}
                  stock={stock}
                  index={tier1.length + i}
                />
              ))}
            </div>
          </div>
        )}

        {/* No picks */}
        {tier1.length === 0 && tier2.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyText}>
              No setups meeting the criteria today. Markets might be choppy —
              sometimes the best trade is no trade.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer style={styles.footer}>
          <p style={styles.footerMeta}>
            Scan: 6AM EST &middot; Cutler RSI (14) &middot; 50-SMA &middot;{" "}
            {data?.totalScanned || 0} stocks scanned
          </p>
          <p style={styles.footerDisclaimer}>
            Not financial advice, just a daughter trying to look smart
          </p>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "var(--bg)",
    padding: "40px 16px 60px",
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
  },
  date: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    marginBottom: "24px",
    letterSpacing: "0.02em",
  },
  greeting: {
    fontFamily: "var(--font-serif), Georgia, serif",
    fontSize: "1.6rem",
    fontWeight: 400,
    color: "var(--text-primary)",
    lineHeight: 1.35,
    marginBottom: "8px",
  },
  subGreeting: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "1rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    marginBottom: "32px",
  },
  section: {
    marginBottom: "28px",
  },
  tierHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
  },
  tierDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--green)",
  },
  tierLabel: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.78rem",
    fontWeight: 500,
    color: "var(--text-primary)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  tierSub: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    fontStyle: "italic",
    marginLeft: "auto",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    fontStyle: "italic",
    lineHeight: 1.6,
  },
  footer: {
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid var(--border)",
    textAlign: "center",
  },
  footerMeta: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.68rem",
    color: "var(--text-muted)",
    marginBottom: "6px",
    letterSpacing: "0.02em",
  },
  footerDisclaimer: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.82rem",
    color: "var(--text-faint)",
    fontStyle: "italic",
  },
};
