// AdminOverview.jsx — full improved version
import { useState, useEffect }  from "react";
import StatCard             from "../../shared/ui/StatCard";
import SectionHeader        from "../../shared/ui/SectionHeader";
import Avatar               from "../../shared/ui/Avatar";
import { useAnnouncements } from "../../shared/hooks/useAnnouncements";
import { useSocket }        from "../../shared/hooks/useSocket";
import { fetchLeaves }      from "../../shared/api/leavesApi";
import Spinner              from "../../shared/ui/Spinner";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

if (typeof document !== "undefined") {
  const id = "remove-recharts-focus-outline";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      .recharts-bar-rectangle:focus,.recharts-wrapper:focus,
      .recharts-surface:focus,.recharts-pie-sector:focus,
      .recharts-layer:focus,.recharts-sector:focus,
      rect:focus,path:focus,g:focus{outline:none!important;box-shadow:none!important;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
    `;
    document.head.appendChild(s);
  }
}

const PeopleIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const CalIcon    = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const ArrowRight = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>);
const MegaIcon   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>);

const STATUS_COLORS = { Active: "#16a34a", Inactive: "#ef4444", "On Leave": "#f59e0b" };
const ROLE_COLORS   = { admin: "#2563eb", moderator: "#ea8833", user: "#16a34a", employee: "#16a34a" };
const DEPT_COLORS   = ["#2563eb","#16a34a","#f59e0b","#9333ea","#0891b2","#dc2626","#0d9488","#7c3aed"];

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

const DeptTick = ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fill="#475569" fontSize={11.5} fontFamily="inherit" fontWeight={500}>{payload.value}</text>
);

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

export default function AdminOverview({ employees: initialEmployees, onNavigate }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [employees,     setEmployees]     = useState(initialEmployees);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [lastEvent,     setLastEvent]     = useState(null);

  useEffect(() => { setEmployees(initialEmployees); }, [initialEmployees]);

  useEffect(() => {
    fetchLeaves()
      .then(data => setPendingLeaves(data.filter(l => l.status === "Pending")))
      .catch(() => setPendingLeaves([]))
      .finally(() => setLeavesLoading(false));
  }, []);

  const flash = (msg) => { setLastEvent(msg); setTimeout(() => setLastEvent(null), 4000); };

  useSocket(user.role, user.id, {
    "employee:added":   (emp) => { setEmployees(prev => prev.find(e => String(e.id||e._id) === String(emp.id)) ? prev : [...prev, { ...emp, id: emp.id }]); flash(`👤 ${emp.name} joined`); },
    "employee:updated": (emp) => { setEmployees(prev => prev.map(e => String(e.id||e._id) === String(emp.id) ? { ...e, ...emp } : e)); flash(`✏️ ${emp.name} updated`); },
    "employee:deleted": ({ id }) => { setEmployees(prev => prev.filter(e => String(e.id||e._id) !== String(id))); flash("🗑 Employee removed"); },
    "leave:applied":    (leave) => { setPendingLeaves(prev => [leave, ...prev]); flash(`📋 ${leave.name} applied for leave`); },
    "leave:updated":    ({ _id, status }) => { if (status !== "Pending") setPendingLeaves(prev => prev.filter(l => String(l._id) !== String(_id))); },
    "announcement:new": () => flash("📢 New announcement posted"),
  });

  const activeCount   = employees.filter(e => e.status === "Active").length;
  const inactiveCount = employees.filter(e => e.status === "Inactive").length;
  const onLeaveCount  = employees.filter(e => e.status === "On Leave").length;

  const statusData = [
    { name: "Active",   value: activeCount   },
    { name: "Inactive", value: inactiveCount },
    { name: "On Leave", value: onLeaveCount  },
  ].filter(d => d.value > 0);

  const deptData = Object.entries(
    employees.reduce((acc, e) => { const d = e.dept || "General"; acc[d] = (acc[d]||0)+1; return acc; }, {})
  ).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count);

  const roleData = Object.entries(
    employees.reduce((acc, e) => { const r = e.role || "employee"; acc[r] = (acc[r]||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const yAxisWidth = deptData.length ? Math.min(Math.max(...deptData.map(d => d.dept.length)) * 7 + 12, 160) : 80;
  const { announcements, loading: aLoading } = useAnnouncements();

  return (
    <>
      {/* ── Live banner ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "8px 14px", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: 10, border: "1px solid #bbf7d0" }}>
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

      {/* ── Stat cards ── */}
      <div className="db-stats-grid">
        <StatCard label="Total Employees" value={employees.length} delta={`${activeCount} active`} up={true}  Icon={PeopleIcon} accentBg="#eff6ff" accentColor="#2563eb" />
        <StatCard label="Active"          value={activeCount}      delta="currently working"        up={true}  Icon={PeopleIcon} accentBg="#f0fdf4" accentColor="#16a34a" />
        <StatCard label="On Leave"        value={onLeaveCount}     delta="currently on leave"       up={null}  Icon={CalIcon}    accentBg="#fef9ec" accentColor="#d97706" />
        <StatCard label="Inactive"        value={inactiveCount}    delta="not currently working"    up={false} Icon={PeopleIcon} accentBg="#fef2f2" accentColor="#dc2626" />
      </div>

      {/* ── Status + Role pies ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="db-card">
          <SectionHeader title="Employee Status" />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={0} dataKey="value" labelLine={false} label={PieLabel} strokeWidth={0} tabIndex={-1}>
                {statusData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || "#94a3b8"} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }} formatter={v => <span style={{ color: "#334155", fontWeight: 500 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="db-card">
          <SectionHeader title="Role Distribution" />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" outerRadius={90} paddingAngle={0} dataKey="value" labelLine={false} label={PieLabel} strokeWidth={0} tabIndex={-1}>
                {roleData.map((e, i) => <Cell key={i} fill={ROLE_COLORS[e.name] || "#94a3b8"} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }} formatter={v => <span style={{ color: "#334155", fontWeight: 500 }}>{{ admin:"Admin", moderator:"Moderator", employee:"Employee", user:"User" }[v] || v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Dept bar ── */}
      <div className="db-card">
        <SectionHeader title="Employees by Department" />
        <ResponsiveContainer width="100%" height={Math.max(deptData.length * 38 + 20, 200)}>
          <BarChart data={deptData} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis dataKey="dept" type="category" tick={<DeptTick />} axisLine={false} tickLine={false} width={yAxisWidth} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="count" name="Employees" radius={[0,8,8,0]} maxBarSize={24} background={{ fill: "#f8fafc", radius: [0,8,8,0] }}>
              {deptData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Pending Leaves + Announcements ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1rem" }}>
        <div className="db-card">
          <SectionHeader title="Pending Leaves" count={pendingLeaves.length} action="View all" onAction={() => onNavigate?.("leaves")} />
          {leavesLoading ? <Spinner text="Loading..." /> : pendingLeaves.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              No pending leaves
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingLeaves.slice(0, 5).map((l, i) => (
                <div key={l._id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "linear-gradient(135deg,#fffbeb,#fef9ec)", borderRadius: 10, border: "1px solid #fde68a", transition: "transform 0.15s", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateX(2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
                >
                  <Avatar initials={l.avatar || (l.name?.split(" ").map(w=>w[0]).join("").toUpperCase()) || "??"} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{l.name}</div>
                    <div style={{ fontSize: 11.5, color: "#92400e" }}>{l.type} · {l.days}d · {l.from}</div>
                  </div>
                  <button onClick={() => onNavigate?.("leaves")}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "#d97706", background: "#fff", border: "1px solid #fde68a", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                    Review <ArrowRight />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="db-card">
          <SectionHeader title="Recent Announcements" action="View all" onAction={() => onNavigate?.("announcements")} />
          {aLoading ? <Spinner text="Loading..." /> : announcements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>No announcements yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {announcements.slice(0, 4).map((a, i, arr) => (
                <div key={a.id} style={{ padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}><MegaIcon /></div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{a.title}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                          {(a.tags || []).slice(0, 3).map(tag => <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>{tag}</span>)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{a.date}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 0 42px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}