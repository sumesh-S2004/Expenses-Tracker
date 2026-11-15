import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../api/axios";
import { useApi } from "../api/useApi";
import Modal, { inputStyle, labelStyle, PrimaryButton, GhostButton } from "./Modal";
import ColorPicker, { SWATCHES } from "./ColorPicker";
import { toInputDate, todayInput } from "../utils/format";

const PAYMENT_METHODS = ["Credit Card", "Debit Card", "UPI", "Bank Transfer", "Net Banking", "Cash", "Other"];

const linkBtn = {
  background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12.5, padding: 0,
  display: "flex", alignItems: "center", gap: 4,
};

/** Add (transaction = null) or edit (transaction = object) a transaction. */
export default function TransactionModal({ transaction, onClose, onSaved }) {
  const editing = !!transaction;
  const { data: catData, setData: setCatData } = useApi("/categories");
  const categories = catData || [];

  const [form, setForm] = useState(() =>
    transaction
      ? {
          title: transaction.title,
          category: transaction.category?._id || transaction.category,
          type: transaction.type,
          amount: transaction.amount,
          date: toInputDate(transaction.date),
          paymentMethod: transaction.paymentMethod,
          notes: transaction.notes || "",
        }
      : { title: "", category: "", type: "expense", amount: "", date: todayInput(), paymentMethod: "UPI", notes: "" }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", color: SWATCHES[0] });
  const [savingCat, setSavingCat] = useState(false);

  const firstOfType = (type) => categories.find((c) => c.type === type)?._id || "";

  // categories may still be loading when the popup opens - pick the first one once they arrive
  useEffect(() => {
    if (!form.category && categories.length) setForm((f) => ({ ...f, category: firstOfType(f.type) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catData]);

  // only categories that match the chosen type (income vs expense)
  const typeCats = categories.filter((c) => c.type === form.type);
  const selectedCat = categories.find((c) => c._id === form.category);
  const options = selectedCat && !typeCats.includes(selectedCat) ? [selectedCat, ...typeCats] : typeCats;

  const changeType = (type) => setForm((f) => ({ ...f, type, category: firstOfType(type) }));

  const saveCategory = async () => {
    if (!newCat.name.trim()) return setError("Type a name for the new category.");
    setSavingCat(true);
    setError("");
    try {
      const res = await api.post("/categories", { name: newCat.name.trim(), type: form.type, color: newCat.color });
      setCatData((prev) => [...(prev || []), res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((f) => ({ ...f, category: res.data._id }));
      setAddingCat(false);
      setNewCat({ name: "", color: SWATCHES[0] });
    } catch (e) {
      setError(e.response?.data?.message || "Could not add the category.");
    } finally {
      setSavingCat(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/transactions/${transaction._id}`, payload);
      else await api.post("/transactions", payload);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Could not save the transaction.");
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? "Edit transaction" : "Add transaction"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Pizza Hut" />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={(e) => changeType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Amount (₹)</label>
            <input style={inputStyle} type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Category</label>
            <button type="button" style={linkBtn} onClick={() => { setAddingCat(!addingCat); setError(""); }}>
              <Plus size={13} /> {addingCat ? "Cancel" : "Add category"}
            </button>
          </div>
          <select style={inputStyle} required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {options.length === 0 && <option value="">No {form.type} categories yet</option>}
            {options.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          {addingCat && (
            <div style={{ marginTop: 10, background: "var(--card-2)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                style={inputStyle} autoFocus value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder={`New ${form.type} category name`}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCategory(); } }}
              />
              <ColorPicker compact value={newCat.color} onChange={(color) => setNewCat({ ...newCat, color })} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <PrimaryButton type="button" onClick={saveCategory} disabled={savingCat} style={{ padding: "8px 14px", fontSize: 13 }}>
                  {savingCat ? "Adding..." : "Add & select"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date</label>
            <input style={inputStyle} type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Payment method</label>
            <select style={inputStyle} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add a note" />
        </div>

        {error && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
