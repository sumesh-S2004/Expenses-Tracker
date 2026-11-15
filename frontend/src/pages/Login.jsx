import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import GoogleButton from "../components/GoogleButton";
import { inputStyle, PrimaryButton } from "../components/Modal";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password, phone.trim());
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError("");
    try {
      await googleLogin(credential);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed. Is the backend running?");
    }
  };

  const switchMode = () => {
    setError("");
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <AuthShell
      title={mode === "login" ? "Log in to your account" : "Create your account"}
      footer={
        <>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={switchMode} style={{ color: "var(--accent)", cursor: "pointer" }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "register" && (
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        {mode === "register" && (
          <input
            type="tel"
            placeholder="Mobile number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern="[0-9+\-\s()]{7,15}"
            title="7 to 15 digits. You can include +, spaces, - or ( )."
            autoComplete="tel"
            style={inputStyle}
          />
        )}
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle}
        />
        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: -4 }}>
            <Link to="/forgot-password" style={{ color: "var(--accent)", fontSize: 12.5, textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>
        )}
        {error && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</div>}
        <PrimaryButton type="submit" disabled={loading} style={{ marginTop: 4, padding: "11px 0", fontSize: 14 }}>
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </PrimaryButton>
      </form>

      <div className="auth-divider">or</div>
      <GoogleButton onCredential={handleGoogle} onError={setError} />
    </AuthShell>
  );
}
