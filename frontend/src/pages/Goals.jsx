import React, { useState } from "react";
import { Plus, Pencil, Trash2, Target, PlusCircle } from "lucide-react";
import api from "../api/axios";
import { useApi } from "../api/useApi";
import Modal, { inputStyle, labelStyle, PrimaryButton, GhostButton } from "../components/Modal";
import ColorPicker, { SWATCHES } from "../components/ColorPicker";
import { Card, PageHeader, Skeleton, ErrorBanner, IconButton } from "../components/ui";
import { inr, formatDate, toInputDate } from "../utils/format";

const emptyForm = { title: "", targetAmount: "", currentAmount: "0", deadline: "", color: SWATCHES[0] };
const tint = (c) => `color-mix(in srgb, ${c} 18%, transparent)`;

export default function Goals() {
  const { data, loading, error, refresh } = useApi("/goals");
  const goals = data || [];

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [contributeFor, setContributeFor] = useState(null);
  const [amount, setAmount] = useState("");

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(""); setShowModal(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({
      title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
      deadline: g.deadline ? toInputDate(g.deadline) : "", color: g.color,
    });
    setFormError("");
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return; // stops accidental double-click duplicates
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) || 0 };
      if (!payload.deadline) delete payload.deadline;
      if (editing) await api.put(`/goals/${editing._id}`, payload);
      else await api.post("/goals", payload);
      setShowModal(false);
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save the goal.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      refresh();
    } catch (err) {
      setPageError(err.response?.data?.message || "Could not delete the goal.");
    }
  };

  const submitContribute = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      await api.post(`/goals/${contributeFor._id}/contribute`, { amount: Number(amount) });
      setContributeFor(null);
      setAmount("");
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not update the goal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="Track savings goals over time."
        action={
          <PrimaryButton onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Goal
          </PrimaryButton>
        }
      />
      <ErrorBanner message={pageError || (!data ? error : "")} />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} h={170} r={16} />)}
        </div>
      ) : goals.length === 0 ? (
        <Card><span style={{ color: "var(--muted)" }}>No goals yet. Add your first savings goal.</span></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            return (
              <Card key={g._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: tint(g.color), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Target size={17} color={g.color} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                      {g.deadline && <div style={{ fontSize: 11, color: "var(--muted-2)" }}>By {formatDate(g.deadline)}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <IconButton label="Edit" onClick={() => openEdit(g)}><Pencil size={14} color="var(--muted)" /></IconButton>
                    <IconButton label="Delete" danger onClick={() => remove(g._id)}><Trash2 size={14} color="var(--red)" /></IconButton>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-2)" }}>{inr(g.currentAmount)} of {inr(g.targetAmount)}</span>
                  <span style={{ color: g.status === "completed" ? "var(--green)" : "var(--muted)" }}>{g.status === "completed" ? "Completed 🎉" : `${pct}%`}</span>
                </div>
                <div style={{ height: 8, background: "var(--track)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: g.color, borderRadius: 4, transition: "width .6s ease" }} />
                </div>
                <GhostButton onClick={() => { setContributeFor(g); setAmount(""); setFormError(""); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <PlusCircle size={14} /> Add contribution
                </GhostButton>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? "Edit goal" : "Add goal"} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Emergency Fund" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Target amount (₹)</label>
                <input style={inputStyle} type="number" min="0" required value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Starting amount (₹)</label>
                <input style={inputStyle} type="number" min="0" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Deadline (optional)</label>
              <input style={inputStyle} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
            </div>
            {formError && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{formError}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <GhostButton type="button" onClick={() => setShowModal(false)}>Cancel</GhostButton>
              <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {contributeFor && (
        <Modal title={`Add to "${contributeFor.title}"`} onClose={() => setContributeFor(null)}>
          <form onSubmit={submitContribute} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Amount (₹) - use a negative number to withdraw</label>
              <input style={inputStyle} type="number" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 2000" />
            </div>
            {formError && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{formError}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <GhostButton type="button" onClick={() => setContributeFor(null)}>Cancel</GhostButton>
              <PrimaryButton type="submit" disabled={saving}>{saving ? "Adding..." : "Add"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
