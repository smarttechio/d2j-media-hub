"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed. Check your editorial credentials.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main" className="section" style={{ padding: "56px 0 88px" }}>
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div
          className="card"
          style={{
            padding: 32,
            borderTop: "4px solid var(--green)",
            boxShadow: "0 12px 32px rgba(6, 43, 19, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <img
              src="/logo.webp"
              alt="D2J Media Hub Logo"
              style={{ width: 48, height: 48, borderRadius: 8, objectFit: "contain" }}
            />
            <div>
              <span className="kicker" style={{ display: "block" }}>
                Editorial &amp; Governance Portal
              </span>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: 24, margin: 0 }}>
                Staff Sign In
              </h1>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 20px" }}>
            Sign in with your authorised D-Path to Jannah Media Hub email address and password.
          </p>

          {error && (
            <div
              role="alert"
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13.5,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="f-row">
              <label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dpathtojannah.com"
              />
            </div>

            <div className="f-row">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            >
              {loading ? "Signing In..." : "Sign In to Dashboard"}
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: "1px solid var(--border)",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            <Link href="/" style={{ color: "var(--green)", fontWeight: 600 }}>
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
