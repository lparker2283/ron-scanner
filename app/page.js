"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import PasswordGate from "@/components/PasswordGate";
import { MOCK_DATA } from "@/lib/mock-data";

export default function Home() {
  const [authed, setAuthed] = useState(null); // null = checking, true/false
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if already authenticated (cookie)
  useEffect(() => {
    // If auth cookie exists, browser will send it automatically.
    // We check by trying to fetch scan data — the middleware/page handles auth.
    // For simplicity, check cookie client-side.
    const hasAuth = document.cookie.includes("rons-scanner-auth=");
    setAuthed(hasAuth);
  }, []);

  // Fetch scan data
  useEffect(() => {
    if (!authed) return;

    async function fetchData() {
      try {
        const res = await fetch("/api/scan");
        if (res.ok) {
          const scanData = await res.json();
          setData(scanData);
        } else {
          // Fall back to mock data if no scan has run yet
          setData(MOCK_DATA);
        }
      } catch {
        setData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authed]);

  // Still checking auth
  if (authed === null) {
    return <div style={{ background: "var(--bg)", minHeight: "100vh" }} />;
  }

  // Not authenticated
  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  // Loading
  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body), Georgia, serif",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          Brewing the scan results...
        </p>
      </div>
    );
  }

  return <Dashboard data={data} />;
}
