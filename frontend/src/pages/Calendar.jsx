import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApi } from "../api/useApi";
import Modal from "../components/Modal";
import { Card, PageHeader, ErrorBanner, IconButton } from "../components/ui";
import { inr, formatDate, todayInput } from "../utils/format";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const short = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState(null);

  const { data, fetching, error } = useApi("/dashboard/calendar", { month, year });

  const dayMap = {};
  (data || []).forEach((d) => { dayMap[d.date] = d; });

  const startWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = todayInput();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, data: dayMap[dateStr] });
  }

  const prev = () => (month === 1 ? (setMonth(12), setYear(year - 1)) : setMonth(month - 1));
  const next = () => (month === 12 ? (setMonth(1), setYear(year + 1)) : setMonth(month + 1));

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Daily income and expenses at a glance."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconButton label="Previous month" onClick={prev}><ChevronLeft size={18} color="var(--muted)" /></IconButton>
            <span style={{ fontSize: 14, color: "var(--text-strong)", minWidth: 140, textAlign: "center" }}>{MONTHS[month - 1]} {year}</span>
            <IconButton label="Next month" onClick={next}><ChevronRight size={18} color="var(--muted)" /></IconButton>
          </div>
        }
      />
      <ErrorBanner message={!data ? error : ""} />

      <Card style={{ padding: 16, opacity: fetching && !data ? 0.6 : 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 6, marginBottom: 8 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11.5, color: "var(--muted-3)", padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 6 }}>
          {cells.map((cell, i) => (
            <div
              key={i}
              onClick={() => cell?.data && setSelected(cell)}
              style={{
                minHeight: 78, borderRadius: 10, padding: 8, overflow: "hidden",
                background: cell ? "var(--card-2)" : "transparent",
                border: cell?.dateStr === today ? "1px solid var(--accent)" : cell?.data ? "1px solid var(--border-2)" : "1px solid transparent",
                cursor: cell?.data ? "pointer" : "default",
              }}
            >
              {cell && (
                <>
                  <div style={{ fontSize: 12, color: cell.dateStr === today ? "var(--accent)" : "var(--muted)", fontWeight: cell.dateStr === today ? 600 : 400, marginBottom: 6 }}>{cell.day}</div>
                  {cell.data?.expense > 0 && <div style={{ fontSize: 10.5, color: "var(--red)" }}>-{short(cell.data.expense)}</div>}
                  {cell.data?.income > 0 && <div style={{ fontSize: 10.5, color: "var(--green)" }}>+{short(cell.data.income)}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {selected && (
        <Modal title={formatDate(selected.dateStr)} onClose={() => setSelected(null)} width={320}>
          {[
            ["Income", inr(selected.data.income), "var(--green)"],
            ["Expenses", inr(selected.data.expense), "var(--red)"],
            ["Transactions", selected.data.count, "var(--text-strong)"],
          ].map(([label, value, color]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: "var(--muted)" }}>{label}</span>
              <span style={{ color }}>{value}</span>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
