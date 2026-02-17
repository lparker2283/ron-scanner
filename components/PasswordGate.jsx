"use client";

import { useState } from "react";

export default function PasswordGate({ onSuccess }) {
  const [value, setValue] = useState("");
  const [shaking, setShaking] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChecking(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: value }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        setShaking(true);
        setValue("");
        setTimeout(() => setShaking(false), 400);
      }
    } catch {
      setShaking(true);
      setValue("");
      setTimeout(() => setShaking(false), 400);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.hint}>Who&apos;s your favorite daughter?</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter passcode"
            autoFocus
            disabled={checking}
            className={shaking ? "shake" : ""}
            style={styles.input}
          />
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
  },
  card: {
    textAlign: "center",
  },
  hint: {
    fontFamily: "var(--font-serif), Georgia, serif",
    fontSize: "1.5rem",
    color: "var(--text-primary)",
    marginBottom: "1.5rem",
  },
  input: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "1rem",
    fontFamily: "var(--font-mono), monospace",
    color: "var(--text-primary)",
    outline: "none",
    width: "260px",
    textAlign: "center",
  },
};
