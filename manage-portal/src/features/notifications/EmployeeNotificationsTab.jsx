import { useState } from "react";
import SectionHeader from "../../shared/ui/SectionHeader";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { LeaveIcon, MegaphoneIcon, PayrollIcon, TaskIcon, AlertIcon } from "../../shared/icons/icons";

const ICON_CLS    = { leave: "tp-icon-leave", announce: "tp-icon-announce", payroll: "tp-icon-payroll", task: "tp-icon-task", system: "tp-icon-system" };
const NOTIF_ICONS = { leave: LeaveIcon, announce: MegaphoneIcon, payroll: PayrollIcon, task: TaskIcon, system: AlertIcon };
const TYPES = ["All", "leave", "announce", "payroll", "task", "system"];

export default function EmployeeNotificationsTab() {
  const { notifs, loading, error, handleMarkRead, handleMarkAll } = useNotifications();
  const [filter, setFilter] = useState("All");

  const unread   = notifs.filter(n => n.unread).length;
  const filtered = filter === "All" ? notifs : notifs.filter(n => n.type === filter);

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading notifications...</div>;
  if (error)   return <div style={{ padding: "2rem", color: "#dc2626" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
        {[
          { label: "Total",  val: notifs.length,          color: "#2563eb", bg: "#eff6ff" },
          { label: "Unread", val: unread,                  color: "#d97706", bg: "#fef9ec" },
          { label: "Read",   val: notifs.length - unread,  color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <SectionHeader title="My Notifications" count={`${unread} unread`} />
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
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No notifications found.</div>}
        </div>
      </div>
    </div>
  );
}