"use client";

export default function SectorFlows({ sectorFlows }) {
  if (!sectorFlows) return null;

  const sectors = Object.entries(sectorFlows)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.flow - a.flow);

  const maxAbsFlow = Math.max(
    ...sectors.map((s) => Math.abs(s.flow)),
    0.1
  );

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        <span style={styles.headingLabel}>Sector Fund Flows</span>
        <span style={styles.headingPeriod}>30 Day</span>
      </h3>
      <div style={styles.list}>
        {sectors.map((sector) => (
          <div key={sector.name} style={styles.row}>
            <span style={styles.sectorName}>{sector.name}</span>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.bar,
                  width: `${Math.min(Math.abs(sector.flow) / maxAbsFlow, 1) * 100}%`,
                  background:
                    sector.flow >= 0
                      ? "var(--green)"
                      : "var(--red)",
                  opacity: sector.flow >= 0 ? 0.7 : 0.4,
                }}
              />
            </div>
            <span
              style={{
                ...styles.flowValue,
                color:
                  sector.flow >= 0
                    ? "var(--green)"
                    : "var(--red)",
              }}
            >
              {sector.flow >= 0 ? "+" : ""}
              {sector.flow}B
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px 24px",
  },
  heading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  headingLabel: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.7rem",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-secondary)",
  },
  headingPeriod: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.65rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  sectorName: {
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "0.82rem",
    color: "var(--text-secondary)",
    minWidth: "140px",
    flexShrink: 0,
  },
  barContainer: {
    flex: 1,
    height: "6px",
    background: "var(--border)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.6s ease-out",
  },
  flowValue: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "0.75rem",
    fontWeight: 500,
    minWidth: "55px",
    textAlign: "right",
  },
};
