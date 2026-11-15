import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

// Rendered ONCE for all logged-in pages, so the sidebar never remounts
// (that's what lets the highlight slide between titles).
export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <div style={{ display: "flex", background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "24px 28px", minWidth: 0 }}>
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
