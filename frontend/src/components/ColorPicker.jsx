import React, { useEffect, useState } from "react";

export const SWATCHES = ["#7C6FF0", "#4C8DF5", "#F5A623", "#3FD6C6", "#B06FF0", "#F0578E", "#3FD68A", "#F5C542", "#6C7A94", "#E24B4A"];

const clamp = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)));

function normalizeHex(v) {
  let s = String(v || "").trim().replace(/^#/, "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return /^[0-9a-fA-F]{6}$/.test(s) ? "#" + s.toLowerCase() : null;
}
function hexToRgb(hex) {
  const h = normalizeHex(hex) || "#000000";
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}
function rgbToHex({ r, g, b }) {
  return "#" + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("");
}

const small = {
  padding: "8px 8px", borderRadius: 8, border: "1px solid var(--border-2)", background: "var(--card-2)",
  color: "var(--text-strong)", fontSize: 13, outline: "none", boxSizing: "border-box",
};

/** Preset swatches + any custom color (color wheel, RGB numbers, or hex). */
export default function ColorPicker({ value, onChange, compact = false }) {
  const hex = normalizeHex(value) || "#7c6ff0";
  const rgb = hexToRgb(hex);
  const [hexText, setHexText] = useState(hex);

  useEffect(() => setHexText(hex), [hex]);

  const setChannel = (ch, v) => onChange(rgbToHex({ ...rgb, [ch]: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SWATCHES.map((c) => (
          <div
            key={c}
            onClick={() => onChange(c.toLowerCase())}
            title={c}
            style={{
              width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer",
              border: hex === c.toLowerCase() ? "2px solid var(--text-strong)" : "2px solid transparent",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          title="Pick any color"
          style={{ width: 40, height: 34, padding: 0, border: "1px solid var(--border-2)", borderRadius: 8, background: "none", cursor: "pointer" }}
        />
        {!compact &&
          ["r", "g", "b"].map((ch) => (
            <label key={ch} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              {ch.toUpperCase()}
              <input
                type="number" min="0" max="255" value={rgb[ch]}
                onChange={(e) => setChannel(ch, e.target.value)}
                style={{ ...small, width: 58 }}
              />
            </label>
          ))}
        <input
          value={hexText}
          onChange={(e) => {
            setHexText(e.target.value);
            const h = normalizeHex(e.target.value);
            if (h) onChange(h);
          }}
          placeholder="#7c6ff0"
          maxLength={7}
          style={{ ...small, width: 86 }}
          aria-label="Hex color"
        />
      </div>
    </div>
  );
}
