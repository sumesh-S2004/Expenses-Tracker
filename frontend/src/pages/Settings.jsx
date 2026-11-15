import React, { useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { inputStyle, labelStyle, PrimaryButton } from "../components/Modal";
import { Card, PageHeader } from "../components/ui";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD"];

const THEMES = [
  { key: "light", label: "Light", icon: Sun, hint: "Bright and clean" },
  { key: "dark", label: "Dark", icon: Moon, hint: "Easy on the eyes" },
  { key: "system", label: "System default", icon: Monitor, hint: "Matches your device" },
];

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const res = await api.put("/auth/me", { name, phone, currency });
      updateUser(res.data);
      setProfileMsg({ type: "ok", text: "Profile updated." });
    } catch (err) {
      setProfileMsg({ type: "err", text: err.response?.data?.message || "Could not update the profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg({ type: "", text: "" });
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      setPwMsg({ type: "ok", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwMsg({ type: "err", text: err.response?.data?.message || "Could not update the password." });
    } finally {
      setSavingPw(false);
    }
  };

  const msg = (m) =>
    m.text && <div style={{ color: m.type === "ok" ? "var(--green)" : "var(--red)", fontSize: 12.5 }}>{m.text}</div>;

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <Card title="Appearance" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {THEMES.map(({ key, label, icon: Icon, hint }) => {
            const active = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                aria-pressed={active}
                style={{
                  textAlign: "left", cursor: "pointer", padding: 14, borderRadius: 12,
                  background: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "var(--card-2)",
                  border: `1.5px solid ${active ? "var(--accent)" : "var(--border-2)"}`,
                  color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 12,
                  transition: "border-color .2s, background-color .2s",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? "var(--accent)" : "var(--track)", color: active ? "#ffffff" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted-2)", marginTop: 2 }}>{hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Card title="Profile" style={{ flex: "1 1 320px" }}>
          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={{ ...inputStyle, opacity: 0.6 }} value={user?.email || ""} disabled />
            </div>
            <div>
              <label style={labelStyle}>Mobile number (optional)</label>
              <input
                style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                pattern="[0-9+\-\s()]{7,15}" title="7 to 15 digits. You can include +, spaces, - or ( )." placeholder="e.g. 98765 43210"
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {msg(profileMsg)}
            <PrimaryButton type="submit" disabled={savingProfile} style={{ alignSelf: "flex-start" }}>
              {savingProfile ? "Saving..." : "Save changes"}
            </PrimaryButton>
          </form>
        </Card>

        <Card title="Change password" style={{ flex: "1 1 320px" }}>
          <form onSubmit={savePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Current password</label>
              <input style={inputStyle} type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>New password</label>
              <input style={inputStyle} type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {msg(pwMsg)}
            <PrimaryButton type="submit" disabled={savingPw} style={{ alignSelf: "flex-start" }}>
              {savingPw ? "Saving..." : "Update password"}
            </PrimaryButton>
          </form>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={logout}
          style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid var(--red)", background: "transparent", color: "var(--red)", fontSize: 13.5, cursor: "pointer" }}
        >
          Log out
        </button>
      </div>
    </>
  );
}
