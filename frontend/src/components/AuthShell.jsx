import React from "react";
import { PiggyBank } from "lucide-react";

export default function AuthShell({ title, children, footer }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div style={{ width: 400, maxWidth: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#6C5CE7,#4C8DF5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <PiggyBank size={18} color="#ffffff" />
          </div>
          <div style={{ color: "var(--text-strong)", fontSize: 17, fontWeight: 600 }}>WealthFlow</div>
        </div>
        <h2 style={{ color: "var(--text-strong)", fontSize: 19, margin: "0 0 18px", fontWeight: 600 }}>{title}</h2>
        {children}
        {footer && <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>{footer}</div>}
      </div>
    </div>
  );
}
