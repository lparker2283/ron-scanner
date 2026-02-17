"use client";

import { useState } from "react";
import MiniChart from "./MiniChart";
import CriteriaTag from "./CriteriaTag";

export default function StockCard({ stock, index }) {
  const [expanded, setExpanded] = useState(false);

  const isTier1 = stock.tier === 1;

  return (
    <div
      className="fade-slide-in"
      style={{
        ...styles.card,
        animationDelay: `${index * 0.08}s`,
        background: isTier1
          ? "linear-gradient(135deg, var(--green-dim), var(--surface))"
          : "var(--surface)",
        borderColor: isTier1 ? "var(--green-border)" : "var(--border)",
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.tickerRow}>
            <span style={styles.ticker}>{stock.ticker}</span>
            {isTier1 && <span style={styles.badge}>Strong Setup</span>}
          </div>
          <span style={styles.companyName}>
            {stock.name} &middot; {stock.sector}
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.price}>${stock.price.toFixed(2)}</span>
          <span style={styles.stopLoss}>Stop: ${stock.stopLoss.toFixed(2)}</span>
        </div>
      </div>

      {/* Chart */}
      {stock.dailyData && stock.dailyData.length > 0 && (
        <div style={styles.chartContainer}>
          <MiniChart dailyData={stock.dailyData} width={480} height={130} />
        </div>
      )}

      {/* Quick stats */}
      <div style={styles.statsRow}>
        <span style={styles.stat}>
          RSI:{" "}
          <span style={styles.statValue}>
            {stock.criteria.find((c) => c.name === "Cutler RSI")?.value || "—"}
          </span>
        </span>
        <span style={styles.stat}>
          Vol:{" "}
          <span style={styles.statValue}>
            {stock.volumeChange > 0 ? "+" : ""}
            {stock.volumeChange}%
          </span>
        </span>
        <span style={styles.stat}>
          <span style={{ color: "var(--green)" }}>
            {stock.metCount}/5
          </span>
        </span>
      </div>

      {/* Criteria tags */}
      <div style={styles.criteriaRow}>
        {stock.criteria.map((c) => (
          <CriteriaTag key={c.name} name={c.name} met={c.met} />
        ))}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={styles.expandBtn}
      >
        {expanded ? "Hide trade note" : "View trade note"}
      </button>

      {/* Trade note */}
      {expanded && (
        <div style={styles.tradeNote}>
          {isTier1 ? (
            <p style={styles.noteText}>
              <strong>Setup confirmed.</strong> Breakout from consolidation with expanding volume.
              50-day SMA turning up with Cutler RSI in the emerging momentum zone.
              {stock.criteria.find((c) => c.name === "Higher Highs")?.doubleConfirmed &&
                " Double-confirmed higher highs — strong seller exhaustion signal."}
              {" "}Consider entry near ${stock.price.toFixed(2)} with stop at $
              {stock.stopLoss.toFixed(2)} (-6%).
            </p>
          ) : (
            <div>
              <p style={styles.noteText}>
                <strong>Developing setup.</strong> Watch for these before entering:
              </p>
              <ul style={styles.noteList}>
                {stock.criteria
                  .filter((c) => !c.met)
                  .map((c) => (
                    <li key={c.name} style={styles.noteItem}>
                      <span style={{ color: "var(--gold)" }}>{c.name}:</span>{" "}
                      {c.detail}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px 24px",
    transition: "border-color 0.2s",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tickerRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  ticker: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "1.1rem",
    fontWeight: 500,
    color: "var(--text-primary)",
  },
  badge: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.65rem",
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: "4px",
    background: "var(--green-dim)",
    border: "1px solid var(--green-border)",
    color: "var(--green)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  companyName: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.82rem",
    color: "var(--text-secondary)",
  },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  price: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "1.1rem",
    fontWeight: 500,
    color: "var(--text-primary)",
  },
  stopLoss: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.72rem",
    color: "var(--text-muted)",
  },
  chartContainer: {
    marginBottom: "12px",
    overflow: "hidden",
    borderRadius: "6px",
    background: "rgba(0,0,0,0.2)",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "10px",
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.78rem",
  },
  stat: {
    color: "var(--text-secondary)",
  },
  statValue: {
    color: "var(--text-primary)",
    fontWeight: 500,
  },
  criteriaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "12px",
  },
  expandBtn: {
    background: "none",
    border: "none",
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    textDecorationColor: "var(--border)",
    textUnderlineOffset: "3px",
  },
  tradeNote: {
    marginTop: "12px",
    padding: "14px 16px",
    background: "rgba(0,0,0,0.15)",
    borderRadius: "8px",
    border: "1px solid var(--border)",
  },
  noteText: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  noteList: {
    marginTop: "8px",
    paddingLeft: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  noteItem: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.82rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
};
