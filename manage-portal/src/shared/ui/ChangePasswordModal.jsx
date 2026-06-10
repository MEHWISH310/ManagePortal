import { useState } from "react";

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];

export default function ChangePasswordModal({ onClose }) {
  const [current,     setCurrent]     = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  const strength = getStrength(newPw);

  const handleSubmit = async () => {
    setError("");
    if (!current)              { setError("Please enter your current password."); return; }
    if (newPw.length < 8)      { setError("New password must be at least 8 characters."); return; }
    if (strength < 2)          { setError("Password is too weak. Add uppercase, numbers or symbols."); return; }
    if (newPw !== confirm)     { setError("Passwords do not match."); return; }
    if (newPw === current)     { setError("New password must be different from current."); return; }

    setSaving(true);
    // Simulate API call — DummyJSON has no real password change endpoint
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => onClose(), 1800);
  };

  const inputWrap = { position: "relative", display: "flex", alignItems: "center" };
  const inputStyle = {
    width: "100%", padding: "10px 38px 10px 36px",
    border: "1.5px solid #e2e8f0", borderRadius: 9,
    fontSize: 14, color: "#0f172a", background: "#f8fafc",
    fontFamily: "inherit", outline: "none",
    transition: "border-color 0.18s, background 0.18s",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(2px)",
    }}
      onClick={onClose}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: 420,
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Change Password</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Update your account password</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "1rem 0", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>Password updated!</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Your password has been changed successfully.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "9px 13px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 7 }}>
                  ⚠ {error}
                </div>
              )}

              {/* Current password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#64748b" }}>Current Password</label>
                <div style={inputWrap}>
                  <span style={{ position: "absolute", left: 11, color: "#94a3b8", display: "flex" }}><LockIcon /></span>
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={current} onChange={e => setCurrent(e.target.value)}
                    placeholder="Enter current password"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}>
                    <EyeIcon open={showCurrent} />
                  </button>
                </div>
              </div>

              {/* New password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#64748b" }}>New Password</label>
                <div style={inputWrap}>
                  <span style={{ position: "absolute", left: 11, color: "#94a3b8", display: "flex" }}><LockIcon /></span>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw} onChange={e => setNewPw(e.target.value)}
                    placeholder="Enter new password"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}>
                    <EyeIcon open={showNew} />
                  </button>
                </div>
                {/* Strength meter */}
                {newPw && (
                  <div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 10, background: i <= strength ? STRENGTH_COLOR[strength] : "#e2e8f0", transition: "background 0.2s" }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: STRENGTH_COLOR[strength] }}>{STRENGTH_LABEL[strength]}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#64748b" }}>Confirm New Password</label>
                <div style={inputWrap}>
                  <span style={{ position: "absolute", left: 11, color: "#94a3b8", display: "flex" }}><LockIcon /></span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{
                      ...inputStyle,
                      borderColor: confirm && confirm !== newPw ? "#ef4444" : "#e2e8f0",
                    }}
                    onFocus={e => { e.target.style.borderColor = confirm !== newPw ? "#ef4444" : "#2563eb"; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = confirm && confirm !== newPw ? "#ef4444" : "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {confirm && confirm !== newPw && (
                  <span style={{ fontSize: 11.5, color: "#ef4444", fontWeight: 500 }}>Passwords do not match</span>
                )}
              </div>

              {/* Requirements */}
              <div style={{ background: "#f8fafc", borderRadius: 9, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { text: "At least 8 characters",       ok: newPw.length >= 8 },
                  { text: "One uppercase letter",         ok: /[A-Z]/.test(newPw) },
                  { text: "One number",                   ok: /[0-9]/.test(newPw) },
                  { text: "One special character",        ok: /[^A-Za-z0-9]/.test(newPw) },
                ].map(r => (
                  <div key={r.text} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: newPw ? (r.ok ? "#16a34a" : "#94a3b8") : "#94a3b8" }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{newPw && r.ok ? "✓" : "○"}</span>
                    {r.text}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "none", fontSize: 13.5, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: "#2563eb", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.75 : 1, display: "flex", alignItems: "center", gap: 8 }}>
                  {saving
                    ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.75s linear infinite" }} /> Updating...</>
                    : "Update Password"
                  }
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}