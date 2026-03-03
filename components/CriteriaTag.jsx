"use client";

export default function CriteriaTag({ name, met }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "0.75rem",
        fontFamily: "var(--font-mono), monospace",
        background: met ? "var(--green-dim)" : "transparent",
        border: met
          ? "1px solid var(--green-border)"
          : "1px solid var(--border)",
        color: met ? "var(--green)" : "var(--text-muted)",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: met ? "var(--green)" : "transparent",
          border: met ? "none" : "1px solid var(--text-muted)",
        }}
      />
      {name}
    </span>
  );
}
