import StatCard             from "../../shared/ui/StatCard";
import SectionHeader        from "../../shared/ui/SectionHeader";
import Avatar               from "../../shared/ui/Avatar";
import { useAnnouncements } from "../../shared/hooks/useAnnouncements";
import { ADMIN_LEAVES }     from "../../shared/data/leaves";
import Spinner              from "../../shared/ui/Spinner";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

if (typeof document !== 'undefined') {
  const styleId = 'remove-recharts-focus-outline';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .recharts-bar-rectangle:focus, .recharts-wrapper:focus,
      .recharts-surface:focus, .recharts-pie-sector:focus,
      .recharts-layer:focus, .recharts-sector:focus,
      rect:focus, path:focus, g:focus {
        outline: none !important; box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

const PeopleIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const CalIcon    = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const ArrowRight = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>);
const MegaIcon   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>);

const STATUS_COLORS = { Active: "#16a34a", Inactive: "#ef4444", "On Leave": "#f59e0b" };
const ROLE_COLORS   = { admin: "#2563eb", moderator: "#ea8833", user: "#16a34a" };
const DEPT_COLORS   = ["#2563eb","#16a34a","#f59e0b","#9333ea","#0891b2","#dc2626","#0d9488","#7c3aed"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {label && <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: "#94a3b8" }}>{p.name}: <strong style={{ color: "#fff" }}>{p.value}</strong></div>
      ))}
    </div>
  );
};

const DeptTick = ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fill="#475569" fontSize={11.5} fontFamily="inherit" fontWeight={500}>
    {payload.value}
  </text>
);

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fontFamily="inherit">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AdminOverview({ employees, onNavigate }) {
  const { announcements, loading: aLoading } = useAnnouncements();
  const pendingLeaves = ADMIN_LEAVES.filter(l => l.status === "Pending");

  // ── All computed from real API employees data ──
  const activeCount    = employees.filter(e => e.status === "Active").length;
  const inactiveCount  = employees.filter(e => e.status === "Inactive").length;
  const onLeaveCount   = employees.filter(e => e.status === "On Leave").length;

  const statusData = [
    { name: "Active",   value: activeCount   },
    { name: "Inactive", value: inactiveCount },
    { name: "On Leave", value: onLeaveCount  },
  ].filter(d => d.value > 0);

  const deptData = Object.entries(
    employees.reduce((acc, e) => {
      const d = e.dept || "General";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  ).map(([dept, count]) => ({ dept, count }))
   .sort((a, b) => b.count - a.count);

  const roleData = Object.entries(
    employees.reduce((acc, e) => {
      const r = e.role || "user";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const yAxisWidth = Math.min(
    Math.max(...deptData.map(d => d.dept.length)) * 7 + 12,
    160
  );

  return (
    <>
      {/* Stat cards — only API data */}
      <div className="db-stats-grid">
        <StatCard label="Total Employees" value={employees.length} delta={`${activeCount} active`}    up={true}  Icon={PeopleIcon} accentBg="#eff6ff" accentColor="#2563eb" />
        <StatCard label="Active"          value={activeCount}      delta="currently working"           up={true}  Icon={PeopleIcon} accentBg="#f0fdf4" accentColor="#16a34a" />
        <StatCard label="On Leave"        value={onLeaveCount}     delta="currently on leave"          up={null}  Icon={CalIcon}    accentBg="#fef9ec" accentColor="#d97706" />
        <StatCard label="Inactive"        value={inactiveCount}    delta="not currently working"       up={false} Icon={PeopleIcon} accentBg="#fef2f2" accentColor="#dc2626" />
      </div>

      {/* Row 1 — Status Donut + Role Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="db-card">
          <SectionHeader title="Employee Status" />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                paddingAngle={0} dataKey="value"
                labelLine={false} label={PieLabel}
                strokeWidth={0} tabIndex={-1}
              >
                {statusData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || "#94a3b8"} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }}
                formatter={v => <span style={{ color: "#334155", fontWeight: 500 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="db-card">
          <SectionHeader title="Role Distribution" />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={roleData} cx="50%" cy="50%"
                outerRadius={90} paddingAngle={0}
                dataKey="value" labelLine={false}
                label={PieLabel} strokeWidth={0} tabIndex={-1}
              >
                {roleData.map((e, i) => <Cell key={i} fill={ROLE_COLORS[e.name] || "#94a3b8"} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }}
                formatter={v => {
                  const labels = { admin: "Admin", moderator: "Moderator", user: "User" };
                  return <span style={{ color: "#334155", fontWeight: 500 }}>{labels[v] || v}</span>;
                }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 — Dept Bar (full width) */}
      <div className="db-card">
        <SectionHeader title="Employees by Department" />
        <ResponsiveContainer width="100%" height={Math.max(deptData.length * 36 + 20, 200)}>
          <BarChart data={deptData} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis dataKey="dept" type="category" tick={<DeptTick />} axisLine={false} tickLine={false} width={yAxisWidth} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="count" name="Employees" radius={[0, 6, 6, 0]} maxBarSize={22} background={{ fill: "#f8fafc", radius: [0, 6, 6, 0] }}>
              {deptData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3 — Pending Leaves + Announcements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1rem" }}>
        <div className="db-card">
          <SectionHeader title="Pending Leaves" count={pendingLeaves.length} action="View all" onAction={() => onNavigate?.("leaves")} />
          {pendingLeaves.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8", fontSize: 13 }}>No pending leaves</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingLeaves.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "linear-gradient(135deg,#fffbeb,#fef9ec)", borderRadius: 10, border: "1px solid #fde68a" }}>
                  <Avatar initials={l.avatar} size={32} />
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
          {aLoading ? <Spinner text="Loading..." /> : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {announcements.slice(0, 4).map((a, i, arr) => (
                <div key={a.id} style={{ padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
                        <MegaIcon />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{a.title}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                          {(a.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{a.date}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 0 36px", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}