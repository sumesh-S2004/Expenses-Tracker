import React, { useState } from "react";
import { Download } from "lucide-react";
import api from "../api/axios";
import { inputStyle, labelStyle, PrimaryButton } from "../components/Modal";
import { Card, PageHeader, ErrorBanner, th, td } from "../components/ui";
import { inr, formatDate, formatDay, todayInput, firstOfMonthInput } from "../utils/format";

// Safe CSV cell (handles commas, quotes, line breaks)
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function downloadCsv(filename, rows) {
  // BOM makes Excel / WPS read the file as UTF-8 correctly
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ghostBtn = {
  display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 9,
  border: "1px solid var(--border-2)", background: "transparent", color: "var(--text-2)", fontSize: 13.5, cursor: "pointer",
};

export default function Reports() {
  const [startDate, setStartDate] = useState(firstOfMonthInput());
  const [endDate, setEndDate] = useState(todayInput());
  const [type, setType] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { startDate, endDate };
      if (type) params.type = type;
      const res = await api.get("/analytics/category-report", { params });
      setReport(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Could not generate the report.");
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = () => {
    const rows = [["Date", "Day", "Title", "Category", "Type", "Amount", "Payment Method", "Notes"]];
    report.transactions.forEach((t) =>
      rows.push([t.date.slice(0, 10), formatDay(t.date), t.title, t.category?.name || "", t.type, t.amount, t.paymentMethod || "", t.notes || ""])
    );
    downloadCsv(`wealthflow-transactions-${startDate}-to-${endDate}.csv`, rows);
  };

  const exportSummary = () => {
    const rows = [["Category", "Type", "Total", "Count"]];
    report.results.forEach((r) => rows.push([r.name, r.type, r.total, r.count]));
    downloadCsv(`wealthflow-summary-${startDate}-to-${endDate}.csv`, rows);
  };

  const income = report?.results.filter((r) => r.type === "income").reduce((s, r) => s + r.total, 0) || 0;
  const expense = report?.results.filter((r) => r.type === "expense").reduce((s, r) => s + r.total, 0) || 0;

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate a report for any date range and export it to Excel." />

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>From</label>
            <input style={inputStyle} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input style={inputStyle} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <PrimaryButton onClick={run} disabled={loading}>{loading ? "Running..." : "Generate report"}</PrimaryButton>
          {report && (
            <>
              <button onClick={exportTransactions} style={ghostBtn}><Download size={15} /> Export transactions (with day)</button>
              <button onClick={exportSummary} style={ghostBtn}><Download size={15} /> Export summary</button>
            </>
          )}
        </div>
      </Card>

      <ErrorBanner message={error} />

      {report && (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              ["Income", income, "var(--green)"],
              ["Expenses", expense, "var(--red)"],
              ["Net", income - expense, income - expense < 0 ? "var(--red)" : "var(--text-strong)"],
            ].map(([label, value, color]) => (
              <Card key={label} style={{ flex: "1 1 180px", padding: "14px 18px" }}>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color }}>{inr(value)}</div>
              </Card>
            ))}
          </div>

          <Card title={`Transactions - ${formatDate(report.start)} to ${formatDate(report.end)}`} style={{ marginBottom: 20 }}>
            {report.transactions.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No transactions in this range.</div>
            ) : (
              <div style={{ overflow: "auto", maxHeight: 420 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      <th style={th}>Date</th>
                      <th style={th}>Day</th>
                      <th style={th}>Title</th>
                      <th style={th}>Category</th>
                      <th style={th}>Type</th>
                      <th style={{ ...th, textAlign: "right", paddingRight: 0 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.map((t) => (
                      <tr key={t._id} style={{ borderTop: "1px solid var(--track)" }}>
                        <td style={{ ...td, color: "var(--muted)", whiteSpace: "nowrap" }}>{t.date.slice(0, 10)}</td>
                        <td style={{ ...td, color: "var(--muted)" }}>{formatDay(t.date)}</td>
                        <td style={{ ...td, color: "var(--text-strong)" }}>{t.title}</td>
                        <td style={{ ...td, color: "var(--text-2)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.category?.color || "#888", display: "inline-block", marginRight: 7 }} />
                          {t.category?.name}
                        </td>
                        <td style={{ ...td, color: "var(--text-2)", textTransform: "capitalize" }}>{t.type}</td>
                        <td style={{ ...td, paddingRight: 0, textAlign: "right", whiteSpace: "nowrap", fontWeight: 500, color: t.type === "income" ? "var(--green)" : "var(--red)" }}>
                          {t.type === "income" ? "+ " : "- "}{inr(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="By category">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={th}>Category</th>
                  <th style={th}>Type</th>
                  <th style={{ ...th, textAlign: "right" }}>Count</th>
                  <th style={{ ...th, textAlign: "right", paddingRight: 0 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr key={r.categoryId + r.type} style={{ borderTop: "1px solid var(--track)" }}>
                    <td style={{ ...td, color: "var(--text-strong)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, display: "inline-block", marginRight: 7 }} />
                      {r.name}
                    </td>
                    <td style={{ ...td, color: "var(--text-2)", textTransform: "capitalize" }}>{r.type}</td>
                    <td style={{ ...td, textAlign: "right", color: "var(--muted)" }}>{r.count}</td>
                    <td style={{ ...td, paddingRight: 0, textAlign: "right", fontWeight: 500, color: r.type === "income" ? "var(--green)" : "var(--red)" }}>{inr(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
