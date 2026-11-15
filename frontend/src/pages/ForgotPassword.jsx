import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import AuthShell from "../components/AuthShell";
import { inputStyle, PrimaryButton } from "../components/Modal";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const back = (
    <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
      Back to log in
    </Link>
  );

  return (
    <AuthShell title="Forgot your password?" footer={back}>
      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "var(--green)", fontSize: 13.5, lineHeight: 1.5 }}>{result.message}</div>
          {result.devResetLink && (
            <div style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 12, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
              Email isn't set up on this server yet, so here is your reset link (shown only while developing):
              <div style={{ marginTop: 8 }}>
                <a href={result.devResetLink} style={{ color: "var(--accent)", wordBreak: "break-all" }}>
                  Open reset link
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
            Enter your account email and we'll send you a link to choose a new password.
          </div>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          {error && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</div>}
          <PrimaryButton type="submit" disabled={loading} style={{ padding: "11px 0", fontSize: 14 }}>
            {loading ? "Sending..." : "Send reset link"}
          </PrimaryButton>
        </form>
      )}
    </AuthShell>
  );
}
