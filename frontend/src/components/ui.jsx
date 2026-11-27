import React from "react";
// n
export const tooltipStyle = {
  background: "var(--tooltip-bg)",
  border: "1px solid var(--border-2)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

export const tooltipItemStyle = { color: "var(--text-strong)" };

export const th = {
  fontWeight: 400,
  padding: "8px 16px 8px 0",
  textAlign: "left",
  color: "var(--muted-3)",
  whiteSpace: "nowrap",
};
export const td = { padding: "12px 16px 12px 0", verticalAlign: "middle" };

export function Card({ title, right, children, style, onClick }) {
  return (
    <div
      className={onClick ? "ui-card card-click" : "ui-card"}
      onClick={onClick}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 20,
        minWidth: 0,
        ...style,
      }}
    >
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-strong)" }}>{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, gap: 12, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text-strong)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: "var(--muted-2)", marginTop: 4 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ w = "100%", h = 16, r = 8, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{message}</div>;
}

export function PageSkeleton() {
  return (
    <div>
      <Skeleton w={220} h={26} style={{ marginBottom: 10 }} />
      <Skeleton w={320} h={14} style={{ marginBottom: 26 }} />
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} h={120} r={16} style={{ flex: "1 1 200px" }} />
        ))}
      </div>
      <Skeleton h={260} r={16} />
    </div>
  );
}

export function Splash() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="spinner" />
    </div>
  );
}

// Round, gray-on-hover icon button. Use for every small clickable icon (edit, delete, arrows, close).
export function IconButton({ onClick, label, danger, disabled, children, style }) {
  return (
    <button
      type="button"
      className={`icon-btn${danger ? " danger" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={style}
    >
      {children}
    </button>
  );
}
