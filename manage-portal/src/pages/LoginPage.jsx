import ForgotPassword from "../features/auth/ForgotPassword";
import { GridIcon, MailIcon, LockIcon, EyeIcon } from "../shared/icons/icons";
import { loginUser } from "../shared/api/authApi";
import { auth, provider } from "../shared/firebase/firebase";
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";

const ADMIN_EMAIL = "mehwish310@gmail.com";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage({ onLogin }) {
  const [showForgot, setShowForgot] = useState(false);
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [gLoading,   setGLoading]   = useState(false);
  const [status,     setStatus]     = useState(null);
  const [message,    setMessage]    = useState("");

  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;

  // ── Google Sign In ──
  const handleGoogleLogin = async () => {
    setGLoading(true);
    setStatus(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;
      const role   = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "employee";

      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("user", JSON.stringify({
        id:       user.uid,
        name:     user.displayName || user.email,
        email:    user.email,
        initials: user.displayName
          ? user.displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
          : user.email[0].toUpperCase(),
        role,
        image: user.photoURL || null,
      }));

      setStatus("success");
      setMessage(`Welcome ${user.displayName?.split(" ")[0] || ""}! Redirecting...`);
      setTimeout(() => onLogin(role), 900);
    } catch (err) {
      setStatus("error");
      setMessage("Google sign-in failed. Please try again.");
    } finally {
      setGLoading(false);
    }
  };

  // ── Email/Password login — now uses our backend ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!email || !password) {
      setStatus("error"); setMessage("Please fill in all fields."); return;
    }
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      const role = data.role === "admin" ? "admin" : "employee";

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        id:       data._id,
        name:     `${data.firstName} ${data.lastName}`,
        email:    data.email,
        initials: `${data.firstName[0]}${data.lastName[0]}`.toUpperCase(),
        role,
        image:    data.image || "",
      }));

      setStatus("success");
      setMessage(`Welcome ${data.firstName}! Redirecting...`);
      setTimeout(() => onLogin(role), 900);
    } catch {
      setStatus("error");
      setMessage("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="left-panel">
        <div className="brand-row">
          <div className="logo-box"><GridIcon /></div>
          <span className="brand-name">ManagePortal</span>
        </div>
        <div className="left-content">
          <div className="tag-pill">Management System</div>
          <h1 className="hero-title">All your operations,<br />one dashboard.</h1>
          <p className="hero-sub">
            Streamline workflows, track performance, and manage your entire team from a single
            unified platform built for modern businesses.
          </p>
          <div className="feature-list">
            {[
              "Real-time analytics & reporting",
              "Team collaboration tools",
              "Role-based access control",
              "Automated workflow management",
            ].map((f) => (
              <div className="feature-item" key={f}><span className="feature-dot" />{f}</div>
            ))}
          </div>
        </div>
        <div className="stats-row">
          {[["12k+", "Active Users"], ["98%", "Uptime SLA"], ["4.9★", "User Rating"]].map(([v, l]) => (
            <div className="stat-box" key={l}>
              <span className="stat-val">{v}</span>
              <span className="stat-label">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="right-panel">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-sub">Sign in to your account</p>
          </div>

          {status && (
            <div className={`alert alert-${status}`}>
              <span className="alert-icon">{status === "success" ? "✓" : "⚠"}</span>
              {message}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={gLoading}
            style={{
              width: "100%", padding: "11px", borderRadius: 9,
              border: "1.5px solid #e2e8f0", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontSize: 15, fontWeight: 600, color: "#334155",
              cursor: gLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginBottom: 16,
              transition: "background 0.15s, border-color 0.15s",
              opacity: gLoading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!gLoading) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            {gLoading ? <span className="spinner" style={{ borderColor: "#e2e8f0", borderTopColor: "#2563eb" }} /> : <GoogleIcon />}
            Sign in with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Email/Password Form */}
          <form className="form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="label" htmlFor="email">Email address</label>
              <div className="input-wrap">
                <span className="input-icon"><MailIcon /></span>
                <input
                  id="email" type="email" className="field-input"
                  placeholder="admin@centralpark.in"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field-group">
              <div className="pw-row">
                <label className="label" htmlFor="password">Password</label>
                <button type="button" className="forgot" onClick={() => setShowForgot(true)}>
                  Forgot password?
                </button>
              </div>
              <div className="input-wrap">
                <span className="input-icon"><LockIcon /></span>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className="field-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: "42px" }}
                  autoComplete="current-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>
          </form>

          <div className="hint-box">
            <span className="hint-label">Demo credentials</span>
            <span className="hint-val">Admin: admin@centralpark.in / Admin@123</span>
            <span className="hint-val">Employee: employee@centralpark.in / Employee@123</span>
          </div>
        </div>
      </div>
    </div>
  );
}