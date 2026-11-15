import React from "react";
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useApi } from "../api/useApi";
import { Card, PageHeader, Skeleton, ErrorBanner, tooltipStyle, tooltipItemStyle } from "../components/ui";
import { inr, compactInr } from "../utils/format";

const axis = { fill: "var(--muted-3)", fontSize: 11 };

export default function Analytics() {
  const { data: trend, loading, error } = useApi("/analytics/monthly-trend", { months: 6 });
  const { data: catReport } = useApi("/analytics/category-report", { type: "expense" });

  const header = <PageHeader title="Analytics" subtitle="Income vs. expenses over the last 6 months, and where this month's spending goes." />;

  if (loading) {
    return (
      <>
        {header}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <Skeleton h={320} r={16} style={{ flex: "1.4 1 340px" }} />
          <Skeleton h={320} r={16} style={{ flex: "1 1 300px" }} />
        </div>
        <Skeleton h={200} r={16} />
      </>
    );
  }
  if (!trend) return <>{header}<ErrorBanner message={error || "Could not load analytics."} /></>;

  const results = catReport?.results || [];
  const max = Math.max(...results.map((x) => x.total), 1);
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const breakdownCols = "minmax(0,1fr) 56px 120px";

  return (
    <>
      {header}

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Card title="Income vs Expenses" style={{ flex: "1.4 1 340px" }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compactInr} width={58} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "var(--hover)" }} formatter={(v) => inr(v)} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
                <Bar dataKey="income" fill="#3FD68A" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#F0577E" name="Expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Net Savings Trend" style={{ flex: "1 1 300px" }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compactInr} width={58} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(v) => inr(v)} />
                <Line type="monotone" dataKey="net" name="Net" stroke="#8B7CF6" strokeWidth={2.5} dot={{ r: 3, fill: "#8B7CF6" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card
        title="This Month's Expense Breakdown"
        right={
          <span style={{ fontSize: 12.5, color: "var(--muted-2)" }}>
            {monthLabel}{total > 0 && <> - Total <span style={{ color: "var(--red)", fontWeight: 600 }}>{inr(total)}</span></>}
          </span>
        }
      >
        {results.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>No expenses recorded in {monthLabel}.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: breakdownCols, columnGap: 12, fontSize: 11.5, color: "var(--muted-3)" }}>
              <span>Category (transactions)</span>
              <span style={{ textAlign: "right" }}>Share</span>
              <span style={{ textAlign: "right" }}>Amount</span>
            </div>
            {results.map((r) => (
              <div key={r.categoryId}>
                <div style={{ display: "grid", gridTemplateColumns: breakdownCols, columnGap: 12, alignItems: "center", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.name}>{r.name}</span>
                    <span style={{ color: "var(--muted-3)", flexShrink: 0 }}>({r.count})</span>
                  </span>
                  <span style={{ textAlign: "right", color: "var(--muted)" }}>{total > 0 ? Math.round((r.total / total) * 1000) / 10 : 0}%</span>
                  <span style={{ textAlign: "right", color: "var(--text-strong)", whiteSpace: "nowrap" }}>{inr(r.total)}</span>
                </div>
                <div style={{ height: 6, background: "var(--track)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((r.total / max) * 100)}%`, height: "100%", background: r.color, borderRadius: 4, transition: "width .6s ease" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
