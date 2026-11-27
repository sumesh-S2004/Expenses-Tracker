import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";
import { Wallet, ArrowDownToLine, Receipt, PiggyBank, Plus, Target } from "lucide-react";
import { useApi } from "../api/useApi";
import { prefetchRoute } from "../api/prefetch";
import { useAuth } from "../context/AuthContext";
import { inr, compactInr, formatDate, formatShort, greeting, capitalize } from "../utils/format";
import { Card, PageHeader, Skeleton, ErrorBanner, tooltipStyle, tooltipItemStyle, th, td } from "../components/ui";
import { PrimaryButton } from "../components/Modal";
import TransactionModal from "../components/TransactionModal";
// n
const tint = (color, pct = 16) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// Card titles are links to the matching tab
function TitleLink({ to, children }) {
  return <Link to={to} className="title-link" onMouseEnter={() => prefetchRoute(to)}>{children}</Link>;
}
function ViewAll({ to }) {
  return <Link to={to} className="view-all" onMouseEnter={() => prefetchRoute(to)}>View all</Link>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useApi("/dashboard/overview");
  const [mode, setMode] = useState("expense");
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();
  // Tapping anywhere on a card opens its page (links/buttons inside keep their own action)
  const go = (to) => (e) => { if (e.target.closest("a, button")) return; navigate(to); };

  const firstName = capitalize((user?.name || "there").split(" ")[0]);
  const header = (
    <PageHeader
      title={`${greeting()}, ${firstName} 👋`}
      subtitle="Here's what's happening with your finances today."
      action={
        <PrimaryButton onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} /> Add Transaction
        </PrimaryButton>
      }
    />
  );
  const addModal = showAdd && <TransactionModal transaction={null} onClose={() => setShowAdd(false)} onSaved={refresh} />;

  if (loading) return <><DashboardSkeleton header={header} />{addModal}</>;
  if (!data) return <>{header}<ErrorBanner message={error || "Could not load the dashboard."} />{addModal}</>;

  const { summary, expenseByCategory, incomeByCategory, trend, recent, budgets, goals = [] } = data;
  const { totalBalance: balance, totalIncome: income, totalExpenses: expenses, savingsRate, changes } = summary;

  // ---- color alerts ----
  const negative = balance < 0;
  const low = !negative && income > 0 && balance < income * 0.2; // under 20% of income
  const balanceColor = negative ? "var(--red)" : low ? "var(--orange)" : "var(--text-strong)";
  const balanceBadge = negative
    ? { text: "Overspent", color: "var(--red)" }
    : low
    ? { text: "Low balance", color: "var(--orange)" }
    : null;
  const overspending = expenses > 0 && expenses > income;
  const savingsColor = savingsRate < 0 ? "var(--red)" : savingsRate < 20 ? "var(--orange)" : "var(--green)";

  return (
    <>
      {header}

      <div className="stat-grid">
        <StatCard
          label="Total Balance" value={inr(balance)} valueColor={balanceColor}
          icon={Wallet} iconBg="linear-gradient(135deg,#6C5CE7,#4C6EF5)"
          delta={changes.balance} badge={balanceBadge}
          borderColor={negative ? "var(--red)" : low ? "var(--orange)" : undefined}
        />
        <StatCard
          label="Total Income" value={inr(income)} valueColor="var(--green)"
          icon={ArrowDownToLine} iconBg="linear-gradient(135deg,#22C87A,#1AA866)" delta={changes.income}
        />
        <StatCard
          label="Total Expenses" value={inr(expenses)} valueColor="var(--red)"
          icon={Receipt} iconBg="linear-gradient(135deg,#F0577E,#D93A5F)"
          delta={changes.expenses} invert
          badge={overspending ? { text: "More than income", color: "var(--red)" } : null}
          borderColor={overspending ? "var(--red)" : undefined}
        />
        <StatCard
          label="Savings Rate" value={`${savingsRate}%`} valueColor={savingsColor}
          icon={PiggyBank} iconBg="linear-gradient(135deg,#F5A623,#E08E00)" delta={changes.savingsRate}
        />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "stretch" }}>
        <OverviewCard mode={mode} setMode={setMode} expense={expenseByCategory} income={incomeByCategory} />

        <Card title="Spending Trend" style={{ flex: "1.3 1 340px" }}>
          {trend.length === 0 ? (
            <Empty text="No spending yet this month." />
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend.map((p) => ({ ...p, label: formatShort(p.date) }))} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B7CF6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8B7CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: "var(--muted-3)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={{ fill: "var(--muted-3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactInr} width={58} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={{ color: "var(--muted)" }} formatter={(v) => [inr(v), "Spent so far"]} />
                  <Area type="monotone" dataKey="amount" stroke="#8B7CF6" strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: "#8B7CF6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card
          title={<TitleLink to="/transactions">Recent Transactions</TitleLink>}
          right={<ViewAll to="/transactions" />}
          style={{ flex: "0.9 1 300px" }}
          onClick={go("/transactions")}
        >
          {recent.length === 0 ? (
            <Empty text="No transactions yet." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {recent.map((t) => (
                <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: tint(t.category?.color || "#7C6FF0", 18),
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Wallet size={15} color={t.category?.color || "#7C6FF0"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted-2)" }}>{t.category?.name}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.type === "income" ? "var(--green)" : "var(--red)" }}>
                      {t.type === "income" ? "+ " : "- "}{inr(t.amount)}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--muted-2)" }}>{formatDate(t.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <>
          <Card title={<TitleLink to="/budgets">Budget Overview</TitleLink>} right={<ViewAll to="/budgets" />} style={{ flex: "1 1 300px" }} onClick={go("/budgets")}>
            {budgets.length === 0 ? (
              <Empty text="No budgets set for this month." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {budgets.map((b) => (
                  <div key={b._id}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, marginBottom: 6 }}>
                      <span style={{ color: "var(--text-2)" }}>{b.category?.name}</span>
                      <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{inr(b.spent, 0)} / {inr(b.limit, 0)}</span>
                    </div>
                    <div style={{ height: 6, background: "var(--track)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(b.percentage, 100)}%`, height: "100%", borderRadius: 4, background: b.percentage >= 100 ? "var(--red)" : b.percentage >= 80 ? "var(--orange)" : b.category?.color || "#7C6FF0", transition: "width .6s ease" }} />
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "var(--muted-2)", marginTop: 4 }}>{b.percentage}%</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={<TitleLink to="/goals">Goals Overview</TitleLink>} right={<ViewAll to="/goals" />} style={{ flex: "1 1 300px" }} onClick={go("/goals")}>
            {goals.length === 0 ? (
              <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
                No goals yet. <Link to="/goals" className="view-all">Add a goal</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {goals.map((g) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                  const done = g.status === "completed";
                  return (
                    <div key={g._id}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, marginBottom: 6 }}>
                        <span style={{ color: "var(--text-2)", display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                          <Target size={13} color={g.color} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</span>
                        </span>
                        <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{inr(g.currentAmount, 0)} / {inr(g.targetAmount, 0)}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--track)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: g.color, transition: "width .6s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted-2)", marginTop: 4 }}>
                        <span>{g.deadline ? `By ${formatDate(g.deadline)}` : ""}</span>
                        <span style={{ color: done ? "var(--green)" : undefined }}>{done ? "Completed 🎉" : `${pct}%`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      </div>

      {addModal}
    </>
  );
}

function StatCard({ label, value, valueColor, icon: Icon, iconBg, delta, invert, badge, borderColor }) {
  const hasDelta = delta !== null && delta !== undefined;
  const flat = hasDelta && delta === 0;
  const up = hasDelta && delta > 0;
  const good = invert ? !up : up; // for expenses, going up is the bad direction
  const deltaColor = !hasDelta || flat ? "var(--muted-2)" : good ? "var(--green)" : "var(--red)";
  const deltaText = !hasDelta ? "New this period" : `${up ? "↗" : flat ? "→" : "↘"} ${Math.abs(delta)}% from last period`;

  return (
    <div
      className="stat-card"
      style={{
        minWidth: 0, background: "var(--card)", borderRadius: 16, padding: "18px 20px",
        border: `1px solid ${borderColor ? tint(borderColor, 55) : "var(--border)"}`, transition: "border-color .3s ease",
      }}
    >
      <div className="stat-head" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="stat-icon" style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} color="#ffffff" />
        </div>
        <span className="stat-label" style={{ color: "var(--muted)", fontSize: 13.5, flex: 1, minWidth: 0 }}>{label}</span>
        {badge && (
          <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 20, color: badge.color, background: tint(badge.color), whiteSpace: "nowrap" }}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="stat-value" style={{ color: valueColor, fontSize: 26, fontWeight: 600, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      <div className="stat-delta" style={{ color: deltaColor, fontSize: 12.5 }}>{deltaText}</div>
    </div>
  );
}

function OverviewCard({ mode, setMode, expense, income }) {
  const [active, setActive] = useState(null); // slice the mouse is on
  useEffect(() => setActive(null), [mode]);

  const d = mode === "expense" ? expense : income;
  const items = d.categories;
  const chartData = items.length ? items : [{ name: "none", total: 1, color: "var(--track)" }];
  const hovered = active !== null ? items[active] : null;

  const toggle = (
    <div style={{ display: "flex", background: "var(--card-2)", border: "1px solid var(--border-2)", borderRadius: 9, padding: 2 }}>
      {["expense", "income"].map((m) => (
        <button
          key={m} onClick={() => setMode(m)}
          style={{
            border: "none", cursor: "pointer", padding: "5px 12px", borderRadius: 7, fontSize: 12,
            background: mode === m ? "var(--accent)" : "transparent",
            color: mode === m ? "#ffffff" : "var(--muted)", transition: "background-color .2s, color .2s",
          }}
        >
          {m === "expense" ? "Expenses" : "Income"}
        </button>
      ))}
    </div>
  );

  return (
    <Card title={mode === "expense" ? "Expense Overview" : "Income Overview"} right={toggle} style={{ flex: "1.2 1 400px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ width: 164, height: 164, position: "relative", flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData} dataKey="total" nameKey="name" innerRadius={52} outerRadius={76}
                paddingAngle={items.length > 1 ? 2 : 0} stroke="none"
                onMouseEnter={(_, i) => items.length && setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {chartData.map((c, i) => (
                  <Cell key={i} fill={c.color} fillOpacity={active === null || active === i ? 1 : 0.3} style={{ transition: "fill-opacity .2s", outline: "none" }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Hovering a slice shows its details here in the middle - nothing is ever drawn on top of other text */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none", width: 96 }}>
            {hovered ? (
              <>
                <div style={{ fontSize: 11, color: hovered.color, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hovered.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{inr(hovered.total, 0)}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted-2)" }}>{hovered.percentage}% of total</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{inr(d.total, 0)}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted-2)" }}>{mode === "expense" ? "Total Expenses" : "Total Income"}</div>
              </>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ flex: "1 1 200px", color: "var(--muted-2)", fontSize: 13 }}>
            {mode === "expense" ? "No expenses this month." : "No income this month."}
          </div>
        ) : (
          // 3 fixed columns: name (truncates) | amount | percent -> never overlaps, even with many categories
          <div
            style={{
              flex: "1 1 240px", minWidth: 0, maxHeight: 200, overflowY: "auto", paddingRight: 4,
              display: "grid", gridTemplateColumns: "minmax(0,1fr) auto 52px", columnGap: 12, rowGap: 11,
              alignItems: "center", fontSize: 12.5,
            }}
          >
            {items.map((c, i) => (
              <React.Fragment key={c.categoryId}>
                <div
                  onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
                  style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, opacity: active === null || active === i ? 1 : 0.5, transition: "opacity .2s" }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <span title={c.name} style={{ color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                </div>
                <div style={{ textAlign: "right", color: "var(--text-2)", whiteSpace: "nowrap" }}>{inr(c.total, 0)}</div>
                <div style={{ textAlign: "right", color: "var(--muted-3)" }}>{c.percentage}%</div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Empty({ text }) {
  return <div style={{ color: "var(--muted-2)", fontSize: 13, padding: "6px 0" }}>{text}</div>;
}

function DashboardSkeleton({ header }) {
  return (
    <>
      {header}
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} h={128} r={16} />)}
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <Skeleton h={260} r={16} style={{ flex: "1.2 1 400px" }} />
        <Skeleton h={260} r={16} style={{ flex: "1.3 1 340px" }} />
        <Skeleton h={260} r={16} style={{ flex: "0.9 1 300px" }} />
      </div>
      <Skeleton h={200} r={16} />
    </>
  );
}
