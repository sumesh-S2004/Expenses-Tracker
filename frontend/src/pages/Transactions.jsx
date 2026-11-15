import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import { useApi } from "../api/useApi";
import { inputStyle, PrimaryButton } from "../components/Modal";
import TransactionModal from "../components/TransactionModal";
import { Card, PageHeader, Skeleton, ErrorBanner, IconButton, th, td } from "../components/ui";
import { inr, formatDate } from "../utils/format";

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");

  const params = { page, limit: 10, category: filterCategory || undefined, type: filterType || undefined };
  const { data, loading, fetching, error, refresh } = useApi("/transactions", params);
  const { data: catData, refresh: refreshCategories } = useApi("/categories");

  const categories = catData || [];
  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;

  const [modal, setModal] = useState(null); // null | { transaction: object | null }
  const [pageError, setPageError] = useState("");

  const closeModal = () => {
    setModal(null);
    refreshCategories(); // pick up any category added inside the popup
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      if (transactions.length === 1 && page > 1) setPage(page - 1);
      else refresh();
    } catch (e) {
      setPageError(e.response?.data?.message || "Could not delete the transaction.");
    }
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="All your income and expenses in one place. Newest first."
        action={
          <PrimaryButton onClick={() => setModal({ transaction: null })} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Transaction
          </PrimaryButton>
        }
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select style={{ ...inputStyle, width: "auto" }} value={filterCategory} onChange={(e) => { setPage(1); setFilterCategory(e.target.value); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={filterType} onChange={(e) => { setPage(1); setFilterType(e.target.value); }}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <ErrorBanner message={pageError || (!data ? error : "")} />

      <Card>
        <div style={{ overflowX: "auto", opacity: fetching && data ? 0.55 : 1, transition: "opacity .2s" }}>
          <table className="tx-table" style={{ width: "100%", fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ ...th, paddingLeft: 14 }}>Transaction</th>
                <th style={th}>Category</th>
                <th style={th}>Date</th>
                <th style={{ ...th, textAlign: "right", paddingRight: 32 }}>Amount</th>
                <th style={th}>Method</th>
                <th style={{ ...th, textAlign: "right", paddingRight: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--track)" }}>
                    <td colSpan={6} style={{ padding: "12px 0" }}><Skeleton h={18} /></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "20px 0", color: "var(--muted)" }}>No transactions found. Add your first one.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id}>
                    <td style={{ ...td, paddingLeft: 14, color: "var(--text-strong)" }}>{t.title}</td>
                    <td style={{ ...td, color: "var(--text-2)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.category?.color || "#888", display: "inline-block", marginRight: 7 }} />
                      {t.category?.name}
                    </td>
                    <td style={{ ...td, color: "var(--muted)", whiteSpace: "nowrap" }}>{formatDate(t.date)}</td>
                    <td style={{ ...td, textAlign: "right", paddingRight: 32, whiteSpace: "nowrap", fontWeight: 500, color: t.type === "income" ? "var(--green)" : "var(--red)" }}>
                      {t.type === "income" ? "+ " : "- "}{inr(t.amount)}
                    </td>
                    <td style={{ ...td, color: "var(--muted)", whiteSpace: "nowrap" }}>{t.paymentMethod}</td>
                    <td style={{ ...td, padding: "6px 14px 6px 0" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <IconButton label="Edit" onClick={() => setModal({ transaction: t })}><Pencil size={15} color="var(--muted)" /></IconButton>
                        <IconButton label="Delete" danger onClick={() => remove(t._id)}><Trash2 size={15} color="var(--red)" /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 14 }}>
          <IconButton label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={18} color={page <= 1 ? "var(--border-2)" : "var(--muted)"} /></IconButton>
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Page {page} of {totalPages}</span>
          <IconButton label="Next page" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={18} color={page >= totalPages ? "var(--border-2)" : "var(--muted)"} /></IconButton>
        </div>
      </Card>

      {modal && <TransactionModal transaction={modal.transaction} onClose={closeModal} onSaved={refresh} />}
    </>
  );
}
