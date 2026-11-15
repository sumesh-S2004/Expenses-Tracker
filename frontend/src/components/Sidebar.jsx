import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid, ArrowLeftRight, Grid3x3, BarChart3, Wallet, Target,
  Calendar, FileText, Settings, PiggyBank, LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { prefetchRoute } from "../api/prefetch";

const ITEM_H = 46;
const GAP = 4;

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, path: "/" },
  { label: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
  { label: "Categories", icon: Grid3x3, path: "/categories" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Budgets", icon: Wallet, path: "/budgets" },
  { label: "Goals", icon: Target, path: "/goals" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const activeIndex = navItems.findIndex((i) => (i.path === "/" ? pathname === "/" : pathname.startsWith(i.path)));

  return (
    <aside
      style={{
        width: 240, flexShrink: 0, boxSizing: "border-box", position: "sticky", top: 0, height: "100vh",
        background: "var(--sidebar)", borderRight: "1px solid var(--border)", padding: "20px 16px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        transition: "background-color .25s ease, border-color .25s ease",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 26px" }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#6C5CE7,#4C8DF5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <PiggyBank size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>WealthFlow</div>
            <div style={{ fontSize: 11, color: "var(--muted-2)" }}>Expense Tracker</div>
          </div>
        </div>

        <nav style={{ position: "relative", display: "flex", flexDirection: "column", gap: GAP }}>
          {/* This highlight glides from one title to the next */}
          <div
            className="nav-indicator"
            style={{
              height: ITEM_H,
              opacity: activeIndex >= 0 ? 1 : 0,
              transform: `translateY(${Math.max(activeIndex, 0) * (ITEM_H + GAP)}px)`,
            }}
          />
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              style={{ height: ITEM_H }}
              onMouseEnter={() => prefetchRoute(item.path)}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: "50%", background: "var(--card-2)", border: "1px solid var(--border-2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
            color: "var(--text-strong)", flexShrink: 0,
          }}
        >
          {(user?.name || "U")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.email}
          </div>
        </div>
        <button
          onClick={logout}
          title="Log out"
          aria-label="Log out"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", padding: 6, borderRadius: 8, display: "flex" }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
