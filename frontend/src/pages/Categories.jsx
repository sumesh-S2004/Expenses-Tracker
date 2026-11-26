// new
import React, { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import api from "../api/axios";
import { useApi } from "../api/useApi";
import Modal, { inputStyle, labelStyle, PrimaryButton, GhostButton } from "../components/Modal";
import ColorPicker, { SWATCHES } from "../components/ColorPicker";
import { PageHeader, Skeleton, ErrorBanner } from "../components/ui";

const emptyForm = { name: "", type: "expense", color: SWATCHES[0] };
const tint = (c) => `color-mix(in srgb, ${c} 18%, transparent)`;

export default function Categories() {
  const { data, loading, error, refresh } = useApi("/categories");
  const categories = data || [];

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");

  const openCreate = (type = "expense") => {
    setEditing(null);
    setForm({ ...emptyForm, type });
    setFormError("");
    setShowModal(true);
  };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type, color: cat.color });
    setFormError("");
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) await api.put(`/categories/${editing._id}`, form);
      else await api.post("/categories", form);
      setShowModal(false);
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save the category.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this category? Existing transactions will keep it.")) return;
    try {
      await api.delete(`/categories/${id}`);
      refresh();
    } catch (err) {
      setPageError(err.response?.data?.message || "Could not delete the category.");
    }
  };

  const section = (title, type) => {
    const list = categories.filter((c) => c.type === type);
    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 10 }}>{title} ({list.length})</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: 12 }}>
          {list.map((cat) => (
            <div key={cat._id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: tint(cat.color), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Tag size={16} color={cat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.name}</div>
              </div>
              <div className="cat-actions">
                <button type="button" className="cat-btn" onClick={() => openEdit(cat)} aria-label={`Edit ${cat.name}`}>
                  <Pencil size={14} /> Edit
                </button>
                <button type="button" className="cat-btn danger" onClick={() => remove(cat._id)} aria-label={`Delete ${cat.name}`}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => openCreate(type)}
            style={{ background: "transparent", border: "1px dashed var(--border-2)", borderRadius: 12, padding: 16, color: "var(--muted)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 88 }}
          >
            <Plus size={15} /> Add {type} category
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Organize your income and expenses into categories."
        action={
          <PrimaryButton onClick={() => openCreate()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Category
          </PrimaryButton>
        }
      />
      <ErrorBanner message={pageError || (!data ? error : "")} />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: 12 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={88} r={12} />)}
        </div>
      ) : (
        <>
          {section("Expense categories", "expense")}
          {section("Income categories", "income")}
        </>
      )}

      {showModal && (
        <Modal title={editing ? "Edit category" : "Add category"} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Groceries" />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
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
    </>
  );
}
