import ForgotPassword from "../features/auth/ForgotPassword";
import { GridIcon, MailIcon, LockIcon, EyeIcon } from "../shared/icons/icons";
import { loginUser } from "../shared/api/authApi";
import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [showForgot, setShowForgot] = useState(false);
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [status,     setStatus]     = useState(null);
  const [message,    setMessage]    = useState("");

  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;

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