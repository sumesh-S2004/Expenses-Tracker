import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import AuthShell from "../components/AuthShell";
import { inputStyle, PrimaryButton } from "../components/Modal";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset the password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      footer={<Link to="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>Back to log in</Link>}
    >
      {done ? (
        <div style={{ color: "var(--green)", fontSize: 13.5, lineHeight: 1.5 }}>
          Password updated. Taking you to log in...
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
          <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} style={inputStyle} />
          {error && (
            <div style={{ color: "var(--red)", fontSize: 12.5 }}>
              {error}{" "}
              {error.includes("expired") && (
                <Link to="/forgot-password" style={{ color: "var(--accent)" }}>Get a new link</Link>
              )}
            </div>
          )}
          <PrimaryButton type="submit" disabled={loading} style={{ padding: "11px 0", fontSize: 14 }}>
            {loading ? "Saving..." : "Update password"}
          </PrimaryButton>
        </form>
      )}
    </AuthShell>
  );
}
