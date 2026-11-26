// new
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MoreVertical, PiggyBank } from "lucide-react";
import Sidebar from "./Sidebar";
import { IconButton } from "./ui";

// Rendered ONCE for all logged-in pages, so the sidebar never remounts
// (that's what lets the highlight slide between titles).
// On phones/tablets the sidebar becomes a slide-in menu opened from the top bar.
export default function Layout({ children }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu after navigating, and on Esc
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="app-shell" style={{ display: "flex", background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={`sidebar-backdrop${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <header className="mobile-topbar">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6C5CE7,#4C8DF5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PiggyBank size={15} color="#ffffff" />
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-strong)" }}>WealthFlow</span>
          </Link>
          <IconButton label="Open menu" onClick={() => setMenuOpen(true)} style={{ marginLeft: "auto" }}><MoreVertical size={22} color="var(--text-strong)" /></IconButton>
        </header>
        <main className="app-main">
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
