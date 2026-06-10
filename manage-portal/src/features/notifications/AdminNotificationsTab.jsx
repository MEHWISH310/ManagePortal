import { useState } from "react";
import SectionHeader from "../../shared/ui/SectionHeader";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { LeaveIcon, MegaphoneIcon, PayrollIcon, TaskIcon, AlertIcon } from "../../shared/icons/icons";

const ICON_CLS   = { leave: "tp-icon-leave", announce: "tp-icon-announce", payroll: "tp-icon-payroll", task: "tp-icon-task", system: "tp-icon-system" };
const NOTIF_ICONS = { leave: LeaveIcon, announce: MegaphoneIcon, payroll: PayrollIcon, task: TaskIcon, system: AlertIcon };
const TYPES = ["All", "leave", "announce", "payroll", "task", "system"];

export default function AdminNotificationsTab() {
  const { notifs, loading, error, handleMarkRead, handleMarkAll, handleAdd, handleDelete } = useNotifications();
  const [filter, setFilter] = useState("All");

  // Compose form
  const [title, setTitle]  = useState("");
  const [sub,   setSub]    = useState("");
  const [type,  setType]   = useState("system");
  const [showCompose, setShowCompose] = useState(false);

  const unread   = notifs.filter(n => n.unread).length;
  const filtered = filter === "All" ? notifs : notifs.filter(n => n.type === filter);

  const submit = async () => {
    if (!title.trim()) return;
    await handleAdd({ title, sub, type, recipientId: null }); // null = broadcast
    setTitle(""); setSub(""); setType("system"); setShowCompose(false);
  };

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading notifications...</div>;
  if (error)   return <div style={{ padding: "2rem", color: "#dc2626" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
        {[
          { label: "Total",  val: notifs.length,           color: "#2563eb", bg: "#eff6ff" },
          { label: "Unread", val: unread,                   color: "#d97706", bg: "#fef9ec" },
          { label: "Read",   val: notifs.length - unread,   color: "#16a34a", bg: "#f0fdf4" },
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
          <button onClick={() => setShowCompose(o => !o)}
            style={{ fontSize: 12.5, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            {showCompose ? "Cancel" : "+ New"}
          </button>
        </div>
        {showCompose && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Notification title..." value={title} onChange={e => setTitle(e.target.value)} />
            <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Subtitle (optional)..." value={sub} onChange={e => setSub(e.target.value)} />
            <select className="db-select" value={type} onChange={e => setType(e.target.value)}>
              {["leave","announce","payroll","task","system"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="submit-btn" style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0 }} onClick={submit}>
                Send to All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <SectionHeader title="All Notifications" count={`${unread} unread`} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {TYPES.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: filter === f ? "#2563eb" : "#f1f5f9", color: filter === f ? "#fff" : "#64748b", textTransform: "capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
            {unread > 0 && <button onClick={handleMarkAll} style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(n => {
            const Icon = NOTIF_ICONS[n.type] || AlertIcon;
            return (
              <div key={n._id} onClick={() => handleMarkRead(n._id)}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: n.unread ? "#f8faff" : "#fff", border: `1px solid ${n.unread ? "#bfdbfe" : "#f1f5f9"}` }}>
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
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No notifications found.</div>}
        </div>
      </div>
    </div>
  );
}