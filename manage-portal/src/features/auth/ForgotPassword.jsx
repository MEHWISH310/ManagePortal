import { useState, useEffect, useRef } from "react";
import { GridIcon, EyeIcon, LockIcon, MailIcon, BackIcon } from "../../shared/icons/icons";

function getPwStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

const strengthMeta = [
  null,
  { label: "Weak",   color: "#ef4444", cls: "fp-bar-weak"   },
  { label: "Fair",   color: "#f59e0b", cls: "fp-bar-fair"   },
  { label: "Good",   color: "#22c55e", cls: "fp-bar-good"   },
  { label: "Strong", color: "#16a34a", cls: "fp-bar-strong" },
];

function ProgressDots({ step, done }) {
  return (
    <div className="fp-prog-dots">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={
            "fp-prog-dot" +
            (i < step || done ? " fp-dot-done"   : "") +
            (i === step && !done ? " fp-dot-active" : "")
          }
        />
      ))}
    </div>
  );
}

function StepEmail({ onSent, onBack }) {
  const [email,      setEmail]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [allEmails,  setAllEmails]  = useState([]);
  const [fetching,   setFetching]   = useState(true);

  useEffect(() => {
    fetch("https://dummyjson.com/users?limit=100&select=email")
      .then(r => r.json())
      .then(data => {
        const emails = data.users.map(u => u.email.toLowerCase());
        setAllEmails(emails);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const val = email.trim();
    if (!val) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError("Please enter a valid email address."); return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const found = allEmails.includes(val.toLowerCase());
      if (!found) {
        setError("No account found with this email. Try again.");
        return;
      }
      onSent(val);
    }, 800);
  };

  return (
    <>
      <button className="fp-back-btn" onClick={onBack}><BackIcon /> Back to login</button>
      <div className="form-header">
        <h2 className="form-title">Forgot password?</h2>
        <p className="form-sub">Enter your work email and we'll send a reset link.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>{error}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="label" htmlFor="fp-email">Email address</label>
          <div className="input-wrap">
            <span className="input-icon"><MailIcon /></span>
            <input
              id="fp-email"
              type="email"
              className="field-input"
              placeholder="e.g. emily.johnson@x.dummyjson.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={fetching}
            />
          </div>
        </div>
        <button type="submit" className="submit-btn" disabled={loading || fetching}>
          {loading || fetching ? <span className="spinner" /> : "Send Reset Link"}
        </button>
      </form>

      <div className="hint-box">
        <span className="hint-label">Demo — use any registered email</span>
        <span className="hint-val">emily.johnson@x.dummyjson.com</span>
        <span className="hint-val">michael.williams@x.dummyjson.com</span>
      </div>

      <ProgressDots step={1} />
    </>
  );
}

function StepSent({ email, onContinue, onBack }) {
  const [timer,     setTimer]     = useState(30);
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const intervalRef = useRef(null);

  const startTimer = () => {
    clearInterval(intervalRef.current);
    setTimer(30);
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(intervalRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => { startTimer(); return () => clearInterval(intervalRef.current); }, []);

  const handleResend = () => {
    setResending(true);
    setResent(false);
    setTimeout(() => {
      setResending(false);
      setResent(true);
      startTimer();
      setTimeout(() => setResent(false), 3000);
    }, 1000);
  };

  return (
    <>
      <div className="fp-success-box">
        <div className="fp-success-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
          </svg>
        </div>
        <div className="fp-success-title">Check your inbox</div>
        <p className="fp-success-sub">We sent a password reset link to</p>
        <span className="fp-email-pill">{email}</span>
        <p className="fp-success-sub" style={{ marginTop: "4px" }}>
          The link expires in <strong>15 minutes</strong>. Check your spam folder if you don't see it.
        </p>

        {resent && (
          <div className="alert alert-success" style={{ width: "100%", justifyContent: "center" }}>
            <span className="alert-icon">✓</span> Reset link resent to {email}
          </div>
        )}

        <button className="submit-btn" style={{ maxWidth: "280px" }} onClick={onContinue}>
          Open Reset Link (Demo)
        </button>

        <p className="fp-resend-text">
          Didn't get it?{" "}
          <button
            className="fp-resend-btn"
            onClick={handleResend}
            disabled={timer > 0 || resending}
          >
            {resending ? "Sending…" : timer > 0 ? `Resend in ${timer}s` : "Resend email"}
          </button>
        </p>

        <button className="fp-back-btn" onClick={onBack}>
          <BackIcon /> Use a different email
        </button>
      </div>
      <ProgressDots step={2} />
    </>
  );
}

function StepReset({ onDone }) {
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const strength = getPwStrength(newPass);
  const meta     = strength > 0 ? strengthMeta[strength] : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!newPass || !confirmPass) { setError("Please fill in both fields.");                                       return; }
    if (newPass.length < 8)       { setError("Password must be at least 8 characters.");                           return; }
    if (strength < 2)             { setError("Password is too weak. Add uppercase letters, numbers, or symbols."); return; }
    if (newPass !== confirmPass)  { setError("Passwords do not match.");                                           return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onDone(); }, 1400);
  };

  return (
    <>
      <div className="form-header">
        <h2 className="form-title">Set new password</h2>
        <p className="form-sub">Choose a strong password for your account.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>{error}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="label" htmlFor="fp-newpass">New password</label>
          <div className="input-wrap">
            <span className="input-icon"><LockIcon /></span>
            <input
              id="fp-newpass"
              type={showNew ? "text" : "password"}
              className="field-input"
              placeholder="Min. 8 characters"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              style={{ paddingRight: "42px" }}
              autoComplete="new-password"
            />
            <button type="button" className="eye-btn" onClick={() => setShowNew(!showNew)}>
              <EyeIcon open={showNew} />
            </button>
          </div>
          <div className="fp-pw-strength">
            <div className="fp-pw-bars">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={"fp-pw-bar" + (i <= strength && meta ? " " + meta.cls : "")}
                />
              ))}
            </div>
            {meta && (
              <span className="fp-pw-label" style={{ color: meta.color }}>{meta.label}</span>
            )}
          </div>
        </div>

        <div className="field-group">
          <label className="label" htmlFor="fp-confirm">Confirm password</label>
          <div className="input-wrap">
            <span className="input-icon"><LockIcon /></span>
            <input
              id="fp-confirm"
              type={showConfirm ? "text" : "password"}
              className="field-input"
              placeholder="Repeat new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              autoComplete="new-password"
            />
            <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? <span className="spinner" /> : "Reset Password"}
        </button>
      </form>
      <ProgressDots step={3} />
    </>
  );
}

function StepDone({ onBack }) {
  return (
    <>
      <div className="fp-success-box">
        <div className="fp-success-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="fp-success-title">Password updated!</div>
        <p className="fp-success-sub">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <div className="alert alert-success">
          <span className="alert-icon">✓</span> All other sessions have been signed out for security.
        </div>
        <button className="submit-btn" onClick={onBack}>Back to Login</button>
      </div>
      <ProgressDots step={3} done />
    </>
  );
}

export default function ForgotPassword({ onBack }) {
  const [step,  setStep]  = useState(1);
  const [email, setEmail] = useState("");
  const [done,  setDone]  = useState(false);

  const stepLabels = [
    "Enter your email address",
    "Check your inbox",
    "Set new password",
  ];

  return (
    <div className="login-root">
      <div className="left-panel">
        <div className="brand-row">
          <div className="logo-box"><GridIcon /></div>
          <span className="brand-name">ManagePortal</span>
        </div>
        <div className="left-content">
          <div className="tag-pill">Password Reset</div>
          <h1 className="hero-title">Back in 3<br />simple steps.</h1>
          <p className="hero-sub">
            We'll send a secure link to your registered email so you can create a new password.
          </p>
          <div className="fp-step-list">
            {stepLabels.map((label, idx) => (
              <div
                key={idx}
                className={"fp-step-item" + (step === idx + 1 && !done ? " fp-step-active" : "")}
              >
                <div className="fp-step-num">{idx + 1}</div>
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="stats-row">
          {[["256-bit", "Encryption"], ["15 min", "Link Expiry"], ["Instant", "Delivery"]].map(([v, l]) => (
            <div className="stat-box" key={l}>
              <span className="stat-val">{v}</span>
              <span className="stat-label">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="right-panel">
        <div className="form-card">
          {!done && step === 1 && (
            <StepEmail onSent={(em) => { setEmail(em); setStep(2); }} onBack={onBack} />
          )}
          {!done && step === 2 && (
            <StepSent email={email} onContinue={() => setStep(3)} onBack={() => setStep(1)} />
          )}
          {!done && step === 3 && (
            <StepReset onDone={() => setDone(true)} />
          )}
          {done && <StepDone onBack={onBack} />}
        </div>
      </div>
    </div>
  );
}