import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../api/axios";
import { useApi } from "../api/useApi";
import Modal, { inputStyle, labelStyle, PrimaryButton, GhostButton } from "../components/Modal";
import { Card, PageHeader, Skeleton, ErrorBanner, IconButton } from "../components/ui";
import { inr } from "../utils/format";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const now = new Date();

export default function Budgets() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, loading, fetching, error, refresh } = useApi("/budgets", { month, year });
  const { data: catData } = useApi("/categories");
  const budgets = data || [];
  const expenseCats = (catData || []).filter((c) => c.type === "expense");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: "", limit: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");

  // categories that already have a budget this month can't be picked twice
  const takenIds = (exceptId) => new Set(budgets.filter((b) => b._id !== exceptId).map((b) => b.category?._id));

  const openCreate = () => {
    setEditing(null);
    const taken = takenIds(null);
    setForm({ category: (expenseCats.find((c) => !taken.has(c._id)) || expenseCats[0])?._id || "", limit: "" });
    setFormError("");
    setShowModal(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ category: b.category?._id, limit: b.limit });
    setFormError("");
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = { category: form.category, limit: Number(form.limit), month, year };
      if (editing) await api.put(`/budgets/${editing._id}`, payload);
      else await api.post("/budgets", payload);
      setShowModal(false);
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save the budget.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await api.delete(`/budgets/${id}`);
      refresh();
    } catch (err) {
      setPageError(err.response?.data?.message || "Could not delete the budget.");
    }
  };

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Set monthly spending limits per category."
        action={
          <PrimaryButton onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Budget
          </PrimaryButton>
        }
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select style={{ ...inputStyle, width: "auto" }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <ErrorBanner message={pageError || (!data ? error : "")} />

      <Card>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} h={34} />)}
          </div>
        ) : budgets.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No budgets set for {MONTHS[month - 1]} {year}. Add one to start tracking.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, opacity: fetching ? 0.6 : 1, transition: "opacity .2s" }}>
            {budgets.map((b) => (
              <div key={b._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.category?.color || "#7C6FF0" }} />
                    <span style={{ fontSize: 13.5, color: "var(--text-strong)" }}>{b.category?.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{inr(b.spent)} / {inr(b.limit)}</span>
                    <IconButton label="Edit" onClick={() => openEdit(b)}><Pencil size={14} color="var(--muted)" /></IconButton>
                    <IconButton label="Delete" danger onClick={() => remove(b._id)}><Trash2 size={14} color="var(--red)" /></IconButton>
                  </div>
                </div>
                <div style={{ height: 8, background: "var(--track)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(b.percentage, 100)}%`, height: "100%", borderRadius: 4, transition: "width .6s ease", background: b.percentage >= 100 ? "var(--red)" : b.percentage >= 80 ? "var(--orange)" : b.category?.color || "#7C6FF0" }} />
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: b.percentage >= 100 ? "var(--red)" : "var(--muted-2)", marginTop: 4 }}>
                  {b.percentage >= 100 ? `Over budget - ${b.percentage}% used` : `${b.percentage}% used`}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showModal && (
        <Modal title={editing ? "Edit budget" : "Add budget"} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {expenseCats.map((c) => {
                  const taken = takenIds(editing?._id).has(c._id);
                  return (
                    <option key={c._id} value={c._id} disabled={taken}>
                      {c.name}{taken ? " (already has a budget)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Monthly limit (₹)</label>
              <input style={inputStyle} type="number" min="0" step="1" required value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="e.g. 15000" />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-2)" }}>Applies to {MONTHS[month - 1]} {year}.</div>
            {formError && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{formError}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <GhostButton type="button" onClick={() => setShowModal(false)}>Cancel</GhostButton>
              <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
