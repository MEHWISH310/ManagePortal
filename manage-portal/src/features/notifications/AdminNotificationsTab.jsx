import { useState, useEffect } from "react";
import SectionHeader from "../../shared/ui/SectionHeader";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { fetchUsers } from "../../shared/api/usersApi";
import { apiPost } from "../../shared/api/apiClient";
import { LeaveIcon, MegaphoneIcon, PayrollIcon, TaskIcon, AlertIcon } from "../../shared/icons/icons";

const ICON_CLS    = { leave: "tp-icon-leave", announce: "tp-icon-announce", payroll: "tp-icon-payroll", task: "tp-icon-task", system: "tp-icon-system" };
const NOTIF_ICONS = { leave: LeaveIcon, announce: MegaphoneIcon, payroll: PayrollIcon, task: TaskIcon, system: AlertIcon };
const TYPES       = ["All", "leave", "announce", "payroll", "task", "system"];
const NOTIF_TYPES = ["leave", "announce", "payroll", "task", "system"];

export default function AdminNotificationsTab() {
  const { notifs, loading, error, handleMarkRead, handleMarkAll, handleDelete } = useNotifications();

  const [filter,      setFilter]      = useState("All");
  const [showCompose, setShowCompose] = useState(false);
  const [title,       setTitle]       = useState("");
  const [sub,         setSub]         = useState("");
  const [type,        setType]        = useState("system");
  const [sendTo,      setSendTo]      = useState("individual");    // "all" | "group" | "individual"
  const [employees,   setEmployees]   = useState([]);
  const [selected,    setSelected]    = useState([]);       // selected employee ids
  const [sending,     setSending]     = useState(false);
  const [successMsg,  setSuccessMsg]  = useState("");

  useEffect(() => {
    if (showCompose) {
      fetchUsers()
        .then(data => setEmployees(Array.isArray(data) ? data.filter(e => e.role !== "admin") : []))
        .catch(() => setEmployees([]));
    }
  }, [showCompose]);

  const toggleEmployee = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const submit = async () => {
    if (!title.trim()) return;
    setSending(true);
    try {
      let recipientIds = [];
      if (sendTo === "all")        recipientIds = [];
      if (sendTo === "individual") recipientIds = selected.slice(0, 1);
      if (sendTo === "group")      recipientIds = selected;

      await apiPost("/notifications/bulk", { title, sub, type, recipientIds });

      setSuccessMsg(`Notification sent to ${sendTo === "all" ? "everyone" : `${recipientIds.length} employee(s)`}!`);
      setTitle(""); setSub(""); setType("system"); setSelected([]); setSendTo("all"); setShowCompose(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      alert("Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  const unread   = notifs.filter(n => n.unread).length;
  const filtered = filter === "All" ? notifs : notifs.filter(n => n.type === filter);

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading notifications...</div>;
  if (error)   return <div style={{ padding: "2rem", color: "#dc2626" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
        {[
          { label: "Total",  val: notifs.length,         color: "#2563eb", bg: "#eff6ff" },
          { label: "Unread", val: unread,                 color: "#d97706", bg: "#fef9ec" },
          { label: "Read",   val: notifs.length - unread, color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCompose ? "1rem" : 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Send Notification</span>
          <button onClick={() => { setShowCompose(o => !o); setSelected([]); setSendTo("all"); }}
            style={{ fontSize: 12.5, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            {showCompose ? "Cancel" : "+ New"}
          </button>
        </div>

        {showCompose && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Send To selector — AT TOP */}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.4px" }}>Send To</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { val: "individual", label: "Individual"    },
                  { val: "group",      label: "Multiple Employees"         },
                  { val: "all",        label: "All Employees" },
                  
                ].map(opt => (
                  <button key={opt.val} onClick={() => { setSendTo(opt.val); setSelected([]); }}
                    style={{ fontSize: 12.5, fontWeight: 600, padding: "7px 16px", borderRadius: 8, border: `1.5px solid ${sendTo === opt.val ? "#2563eb" : "#e2e8f0"}`, background: sendTo === opt.val ? "#eff6ff" : "#f8fafc", color: sendTo === opt.val ? "#2563eb" : "#64748b", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Employee selector for group/individual */}
            {(sendTo === "group" || sendTo === "individual") && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {sendTo === "individual" ? "Select Employee" : `Select Employees (${selected.length} selected)`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 8 }}>
                  {employees.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "1rem" }}>Loading employees...</div>
                  ) : employees.map(emp => {
                    const isSelected = selected.includes(emp._id || emp.id);
                    return (
                      <div key={emp._id || emp.id}
                        onClick={() => {
                          const id = emp._id || emp.id;
                          if (sendTo === "individual") {
                            setSelected([id]);
                          } else {
                            toggleEmployee(id);
                          }
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: isSelected ? "#eff6ff" : "#f8fafc", border: `1px solid ${isSelected ? "#bfdbfe" : "#f1f5f9"}`, transition: "all 0.15s" }}
                      >
                        {sendTo === "individual" ? (
                          <input
                            type="radio"
                            name="emp-select"
                            checked={isSelected}
                            onChange={() => setSelected([emp._id || emp.id])}
                            style={{ width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer", flexShrink: 0 }}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isSelected ? "#2563eb" : "#cbd5e1"}`, background: isSelected ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                            {isSelected && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
                          </div>
                        )}
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2563eb", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {`${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: 11.5, color: "#64748b" }}>{emp.email} · {emp.dept}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Title, subtitle, type */}
            <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Notification title..." value={title} onChange={e => setTitle(e.target.value)} />
            <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Subtitle (optional)..." value={sub} onChange={e => setSub(e.target.value)} />
            <select className="db-select" value={type} onChange={e => setType(e.target.value)}>
              {NOTIF_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowCompose(false)}
                style={{ padding: "0 16px", height: 38, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "none", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button className="submit-btn"
                style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0, opacity: (sendTo !== "all" && selected.length === 0) ? 0.5 : 1 }}
                onClick={submit}
                disabled={sending || (sendTo !== "all" && selected.length === 0)}>
                {sending
                  ? "Sending..."
                  : sendTo === "all"
                  ? "Send to All"
                  : sendTo === "individual" && selected.length === 1
                  ? `Send to ${employees.find(e => (e._id || e.id) === selected[0])?.firstName || "Employee"}`
                  : `Send to ${selected.length} Employee${selected.length !== 1 ? "s" : ""}`
                }
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <SectionHeader title="All Notifications" count={`${unread} unread`} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {TYPES.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: filter === f ? "#2563eb" : "#f1f5f9", color: filter === f ? "#fff" : "#64748b", textTransform: "capitalize" }}>
                  {f === "All" ? "All" : f}
                </button>
              ))}
            </div>
            {unread > 0 && (
              <button onClick={handleMarkAll}
                style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(n => {
            const Icon = NOTIF_ICONS[n.type] || AlertIcon;
            return (
              <div key={n._id} onClick={() => handleMarkRead(n._id)}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: n.unread ? "#f8faff" : "#fff", border: `1px solid ${n.unread ? "#bfdbfe" : "#f1f5f9"}`, transition: "background 0.15s" }}>
                <div className={`tp-notif-icon ${ICON_CLS[n.type] || "tp-icon-system"}`}><Icon /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: n.unread ? 700 : 500, color: "#0f172a", marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 3 }}>{n.sub}</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{n.time}</div>
                </div>
                {n.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 4 }} />}
                <button onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 14, padding: 2 }}
                  onMouseEnter={ev => ev.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={ev => ev.currentTarget.style.color = "#cbd5e1"}>✕</button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No notifications found.</div>
          )}
        </div>
      </div>
    </div>
  );
}