import { useState, useEffect, useMemo } from "react";
import SectionHeader from "../../shared/ui/SectionHeader";
import StatusBadge   from "../../shared/ui/StatusBadge";
import Spinner       from "../../shared/ui/Spinner";
import { fetchLeaves, applyLeave } from "../../shared/api/leavesApi";

const LEAVE_QUOTA = {
  Annual:  24,
  Medical: 6,
  Casual:  6,
  Earned:  12,
};

const BALANCE_META = {
  Annual:  { color: "#2563eb", bg: "#eff6ff" },
  Medical: { color: "#16a34a", bg: "#f0fdf4" },
  Casual:  { color: "#d97706", bg: "#fef9ec" },
  Earned:  { color: "#9333ea", bg: "#fdf4ff" },
};

export default function EmployeeLeavesTab() {
  const [leaves,   setLeaves]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [type,     setType]     = useState("Casual");
  const [from,     setFrom]     = useState("");
  const [to,       setTo]       = useState("");
  const [reason,   setReason]   = useState("");
  const [applying, setApplying] = useState(false);
  const [errMsg,   setErrMsg]   = useState("");

  useEffect(() => {
    fetchLeaves()
      .then(data  => setLeaves(data))
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Used days = only APPROVED leaves count against balance
  const usedByType = useMemo(() => {
    const counts = {};
    leaves
      .filter(l => l.status === "Approved")
      .forEach(l => { counts[l.type] = (counts[l.type] || 0) + (l.days || 0); });
    return counts;
  }, [leaves]);

  const balanceCards = Object.entries(LEAVE_QUOTA).map(([leaveType, total]) => {
    const used = usedByType[leaveType] || 0;
    const left = Math.max(0, total - used);
    const meta = BALANCE_META[leaveType] || { color: "#64748b", bg: "#f8fafc" };
    return { type: leaveType, total, used, left, ...meta };
  });

  const apply = async () => {
    if (!from || !to) { setErrMsg("Please select both From and To dates."); return; }
    if (new Date(to) < new Date(from)) { setErrMsg("To date must be after From date."); return; }
    const days  = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
    const quota = LEAVE_QUOTA[type] || 0;
    const used  = usedByType[type]  || 0;
    if (days > quota - used) {
      setErrMsg(`Not enough ${type} leave balance. Only ${quota - used} day(s) left.`);
      return;
    }
    setErrMsg("");
    setApplying(true);
    try {
      const newLeave = await applyLeave({ type, from, to, days, reason: reason || "—" });
      setLeaves(prev => [...prev, newLeave]);
      setFrom(""); setTo(""); setReason("");
    } catch (err) {
      setErrMsg("Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner text="Loading leaves..." />;
  if (error)   return <div className="db-error">Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Apply form */}
      <div className="db-card">
        <SectionHeader title="Apply for Leave" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Leave Type</label>
            <select className="db-select" style={{ width: "100%" }} value={type} onChange={e => setType(e.target.value)}>
              {Object.keys(LEAVE_QUOTA).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>From</label>
            <input className="field-input" style={{ paddingLeft: 12 }} type="date" value={from} onChange={e => { setFrom(e.target.value); setErrMsg(""); }} />
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>To</label>
            <input className="field-input" style={{ paddingLeft: 12 }} type="date" value={to} onChange={e => { setTo(e.target.value); setErrMsg(""); }} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Reason (optional)</label>
          <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Briefly describe the reason..." value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        {errMsg && (
          <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>⚠ {errMsg}</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="submit-btn" style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0 }} onClick={apply} disabled={applying}>
            {applying ? <span className="spinner" /> : "Apply for Leave"}
          </button>
        </div>
      </div>

      {/* Dynamic balances — all 4 types, full quota shown when 0 used */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
        {balanceCards.map(l => (
          <div key={l.type} style={{ background: l.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${l.color}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{l.type} Leave</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: l.left === 0 ? "#dc2626" : l.color }}>
                {l.left} left
              </span>
            </div>
            <div style={{ height: 6, background: "#e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
              <div style={{
                height: "100%",
                width: `${l.used === 0 ? 0 : Math.min((l.used / l.total) * 100, 100)}%`,
                background: l.left === 0 ? "#dc2626" : l.color,
                borderRadius: 10,
                transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{ fontSize: 11.5, color: "#64748b" }}>{l.used} used of {l.total} days</div>
          </div>
        ))}
      </div>

      {/* Leave history */}
      <div className="db-card">
        <SectionHeader title="Leave History" count={leaves.length} />
        {leaves.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: 13 }}>No leaves applied yet.</div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td><span style={{ fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>{l.type}</span></td>
                    <td>{l.from}</td>
                    <td>{l.to}</td>
                    <td>{l.days}</td>
                    <td style={{ fontSize: 12.5, color: "#64748b" }}>{l.reason}</td>
                    <td><StatusBadge label={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}