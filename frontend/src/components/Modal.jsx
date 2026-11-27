import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./ui";
// n
export default function Modal({ title, onClose, children, width = 440 }) {
  // Esc closes the popup; the page behind doesn't scroll while it's open
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Rendered straight into <body> so it is centred on the whole screen,
  // never trapped inside the page content (which cut the title off before).
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "var(--overlay)",
        display: "flex", overflowY: "auto", padding: "24px 16px", boxSizing: "border-box",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width, maxWidth: "100%", margin: "auto", boxSizing: "border-box", /* margin:auto = centred, and scrolls from the top when tall */
          background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24,
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-strong)" }}>{title}</span>
          <IconButton label="Close" onClick={onClose} style={{ marginRight: -8 }}><X size={18} color="var(--muted)" /></IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 9, boxSizing: "border-box",
  border: "1px solid var(--border-2)", background: "var(--card-2)", color: "var(--text-strong)",
  fontSize: 13.5, outline: "none",
};

export const labelStyle = { fontSize: 12.5, color: "var(--muted)", marginBottom: 6, display: "block" };

export function PrimaryButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 18px", borderRadius: 9, border: "none", color: "#ffffff",
        background: "linear-gradient(135deg,#6C5CE7,#4C6EF5)", fontSize: 13.5, fontWeight: 500,
        cursor: props.disabled ? "not-allowed" : "pointer", opacity: props.disabled ? 0.65 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 18px", borderRadius: 9, border: "1px solid var(--border-2)",
        background: "transparent", color: "var(--text-2)", fontSize: 13.5,
        cursor: props.disabled ? "not-allowed" : "pointer", ...style,
      }}
    >
      {children}
    </button>
  );
}
