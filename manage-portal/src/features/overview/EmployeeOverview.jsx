import { useState, useEffect } from "react";
import StatCard             from "../../shared/ui/StatCard";
import SectionHeader        from "../../shared/ui/SectionHeader";
import { useTasks }         from "../../shared/hooks/useTasks";
import { useAnnouncements } from "../../shared/hooks/useAnnouncements";
import { useSocket }        from "../../shared/hooks/useSocket";
import Spinner              from "../../shared/ui/Spinner";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";

if (typeof document !== "undefined") {
  const id = "remove-recharts-focus-outline-employee";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      .recharts-bar-rectangle:focus,.recharts-wrapper:focus,
      .recharts-surface:focus,.recharts-pie-sector:focus,
      .recharts-layer:focus,rect:focus,path:focus,g:focus{outline:none!important;box-shadow:none!important;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
    `;
    document.head.appendChild(s);
  }
}

const CheckBigIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>);
const BellIcon     = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const MegaIcon     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>);

const PRIORITY_COLOR = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
const PRIORITY_BG    = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f0fdf4" };
const PRIORITY_TEXT  = { High: "#b91c1c", Medium: "#b45309", Low: "#15803d" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
      {label && <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: "#94a3b8" }}>{p.name}: <strong style={{ color: "#fff" }}>{p.value}</strong></div>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fontFamily="inherit">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function EmployeeOverview({ onNavigate }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { tasks,         loading: tLoading, handleToggle } = useTasks();
  const { announcements, loading: aLoading }               = useAnnouncements();

  const [lastEvent,     setLastEvent]     = useState(null);
  const [newAnnBadge,   setNewAnnBadge]   = useState(false);
  const [newNotifBadge, setNewNotifBadge] = useState(false);

  const flash = (msg) => { setLastEvent(msg); setTimeout(() => setLastEvent(null), 4000); };

  useSocket(user.role, user.id, {
    "task:added":       (task) => { flash(`📋 New task: "${task.title}"`); setNewNotifBadge(true); },
    "task:updated":     (task) => { flash(`✅ Task updated: "${task.title}"`); },
    "task:deleted":     ()     => { flash("🗑 A task was removed"); },
    "announcement:new": (ann)  => { flash(`📢 New: "${ann?.title || ""}"`); setNewAnnBadge(true); },
    "leave:updated":    ({ status }) => {
      if (status === "Approved") flash("✅ Your leave was approved!");
      if (status === "Rejected") flash("❌ Your leave was rejected.");
    },
    "payroll:updated":  () => { flash("💰 Your payslip has been updated"); setNewNotifBadge(true); },
    "notification:new": (n) => { flash(`🔔 ${n?.title || "New notification"}`); setNewNotifBadge(true); },
  });

  const pending   = tasks.filter(t => !t.done).length;
  const completed = tasks.filter(t => t.done).length;
  const total     = tasks.length;

  const priorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

  const taskSummary = [
    { label: "Pending",   count: pending,   fill: "#f59e0b" },
    { label: "Completed", count: completed, fill: "#16a34a" },
    { label: "Total",     count: total,     fill: "#2563eb" },
  ];

  const pendingList = tasks.filter(t => !t.done).slice(0, 5);

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <>
      {/* ── Live banner ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "8px 14px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 10, border: "1px solid #bbf7d0" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700, letterSpacing: "0.3px" }}>LIVE DASHBOARD</span>
        </span>
        {lastEvent && (
          <div style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 600, background: "#fff", padding: "4px 14px", borderRadius: 20, boxShadow: "0 2px 8px rgba(37,99,235,0.12)", animation: "slideIn 0.3s ease" }}>
            ⚡ {lastEvent}
          </div>
        )}
        <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>Real-time · Socket.IO</span>
      </div>

      {/* ── Welcome + completion bar ── */}
      <div className="db-card" style={{ background: "linear-gradient(135deg,#eff6ff,#e0f2fe)", border: "1px solid #bfdbfe" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user.name?.split(" ")[0] || "there"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>Here's your task progress today</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>{completionPct}%</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>completed</div>
          </div>
        </div>
        <div style={{ marginTop: 14, height: 8, background: "#dbeafe", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${completionPct}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)", borderRadius: 10, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: "#64748b" }}>
          <span>{completed} completed</span>
          <span>{pending} remaining</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="db-stats-grid">
        <StatCard label="Total Tasks"  value={total}     sub="assigned to you"      Icon={CheckBigIcon} accentBg="#eff6ff" accentColor="#2563eb" />
        <StatCard label="Pending"      value={pending}   sub="need to be completed"  Icon={CheckBigIcon} accentBg="#fef9ec" accentColor="#d97706" />
        <StatCard label="Completed"    value={completed} sub="completed so far"      Icon={CheckBigIcon} accentBg="#f0fdf4" accentColor="#16a34a" />
        <StatCard
          label="Announcements"
          value={announcements.length}
          sub={newAnnBadge ? "🔴 new since last visit" : "total posts"}
          Icon={BellIcon}
          accentBg={newAnnBadge ? "#fdf4ff" : "#f8fafc"}
          accentColor={newAnnBadge ? "#9333ea" : "#64748b"}
        />
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="db-card">
          <SectionHeader title="Task Summary" />
          {tLoading ? <Spinner text="Loading..." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Tasks" radius={[8,8,0,0]} maxBarSize={56} tabIndex={-1}>
                  {taskSummary.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="db-card">
          <SectionHeader title="Tasks by Priority" />
          {tLoading ? <Spinner text="Loading..." /> : priorityData.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: "#94a3b8", fontSize: 13 }}>No tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={85} paddingAngle={0} dataKey="value" labelLine={false} label={PieLabel} strokeWidth={0} tabIndex={-1}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={PRIORITY_COLOR[entry.name] || "#94a3b8"} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }} formatter={v => <span style={{ color: "#334155", fontWeight: 500 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Pending tasks list ── */}
      <div className="db-card">
        <SectionHeader title="My Pending Tasks" count={`${pending} pending`} action="View all" onAction={() => onNavigate("tasks")} />
        {tLoading ? <Spinner text="Loading..." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pendingList.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "2rem 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                No pending tasks. Great job!
              </div>
            ) : pendingList.map((t) => (
              <div key={t.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9", transition: "all 0.15s" }}
                onMouseEnter={ev => { ev.currentTarget.style.background = "#f1f5f9"; ev.currentTarget.style.transform = "translateX(2px)"; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = "#f8fafc"; ev.currentTarget.style.transform = "none"; }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[t.priority] || "#94a3b8", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{t.title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: PRIORITY_BG[t.priority], color: PRIORITY_TEXT[t.priority], whiteSpace: "nowrap" }}>
                  {t.priority}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>Due {t.due}</span>
                <button onClick={() => handleToggle(t.id)}
                  style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 7, border: "none", background: "#eff6ff", color: "#2563eb", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                  onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                >
                  Mark Done
                </button>
              </div>
            ))}
            {tasks.filter(t => !t.done).length > 5 && (
              <button onClick={() => onNavigate("tasks")}
                style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textAlign: "center", padding: "8px 0" }}>
                + {tasks.filter(t => !t.done).length - 5} more tasks →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Announcements ── */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Latest Announcements</span>
            {newAnnBadge && <span style={{ fontSize: 10, fontWeight: 700, background: "#9333ea", color: "#fff", padding: "1px 8px", borderRadius: 20 }}>NEW</span>}
          </div>
          <button onClick={() => { onNavigate("announcements"); setNewAnnBadge(false); }}
            style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}>
            View all →
          </button>
        </div>
        {aLoading ? <Spinner text="Loading..." /> : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {announcements.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "1.5rem 0" }}>No announcements yet.</div>
            ) : announcements.slice(0, 3).map((a, i, arr) => (
              <div key={a.id} style={{ padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
                      <MegaIcon />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>{a.title}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                        {(a.tags || []).slice(0, 3).map(tag => <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>{tag}</span>)}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{a.date}</span>
                </div>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 0 42px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}