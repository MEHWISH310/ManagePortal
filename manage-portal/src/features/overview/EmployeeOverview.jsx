import StatCard             from "../../shared/ui/StatCard";
import SectionHeader        from "../../shared/ui/SectionHeader";
import { useTasks }         from "../../shared/hooks/useTasks";
import { useAnnouncements } from "../../shared/hooks/useAnnouncements";
import Spinner              from "../../shared/ui/Spinner";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";

if (typeof document !== 'undefined') {
  const styleId = 'remove-recharts-focus-outline-employee';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .recharts-bar-rectangle:focus, .recharts-wrapper:focus,
      .recharts-surface:focus, .recharts-pie-sector:focus,
      .recharts-layer:focus, rect:focus, path:focus, g:focus {
        outline: none !important; box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

const CheckBigIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>);
const MegaIcon     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>);

const PRIORITY_COLOR = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
const PRIORITY_BG    = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f0fdf4" };

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

export default function EmployeeOverview({ onNavigate }) {
  const { tasks,         loading: tLoading } = useTasks();
  const { announcements, loading: aLoading } = useAnnouncements();

  const pending   = tasks.filter(t => !t.done).length;
  const completed = tasks.filter(t => t.done).length;
  const total     = tasks.length;

  const priorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.entries(priorityCounts)
    .map(([name, value]) => ({ name, value }));

  const taskSummary = [
    { label: "Pending",   count: pending,   fill: "#f59e0b" },
    { label: "Completed", count: completed, fill: "#16a34a" },
    { label: "Total",     count: total,     fill: "#2563eb" },
  ];

  const pendingList = tasks.filter(t => !t.done).slice(0, 5);

  return (
    <>
      {/* Stat cards — only API data */}
      <div className="db-stats-grid">
        <StatCard label="Total Tasks"    value={total}     sub="from DummyJSON API"   Icon={CheckBigIcon} accentBg="#eff6ff" accentColor="#2563eb" />
        <StatCard label="Tasks Pending"  value={pending}   sub="need to be completed" Icon={CheckBigIcon} accentBg="#fef9ec" accentColor="#d97706" />
        <StatCard label="Tasks Done"     value={completed} sub="completed so far"     Icon={CheckBigIcon} accentBg="#f0fdf4" accentColor="#16a34a" />
        <StatCard label="Announcements"  value={announcements.length} sub="total posts" Icon={CheckBigIcon} accentBg="#fdf4ff" accentColor="#9333ea" />
      </div>

      {/* Row 1 — Task Summary Bar + Priority Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="db-card">
          <SectionHeader title="Task Summary" />
          {tLoading ? <Spinner text="Loading..." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={taskSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]} maxBarSize={60} tabIndex={-1}>
                  {taskSummary.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="db-card">
          <SectionHeader title="Tasks by Priority" />
          {tLoading ? <Spinner text="Loading..." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={priorityData} cx="50%" cy="50%"
                  outerRadius={90} paddingAngle={0}
                  dataKey="value" labelLine={false}
                  label={PieLabel} strokeWidth={0} tabIndex={-1}
                >
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLOR[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }}
                  formatter={v => <span style={{ color: "#334155", fontWeight: 500 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2 — Pending tasks list */}
      <div className="db-card">
        <SectionHeader title="My Pending Tasks" count={`${pending} pending`} action="View all" onAction={() => onNavigate("tasks")} />
        {tLoading ? <Spinner text="Loading..." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {pendingList.length === 0 && (
              <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "1.5rem 0" }}>No pending tasks. Great job! 🎉</div>
            )}
            {pendingList.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[t.priority] || "#94a3b8", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{t.title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority], whiteSpace: "nowrap" }}>
                  {t.priority}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>Due {t.due}</span>
              </div>
            ))}
            {tasks.filter(t => !t.done).length > 5 && (
              <button onClick={() => onNavigate("tasks")}
                style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 500, textAlign: "center", padding: "6px 0" }}>
                + {tasks.filter(t => !t.done).length - 5} more tasks
              </button>
            )}
          </div>
        )}
      </div>

      {/* Row 3 — Announcements */}
      <div className="db-card">
        <SectionHeader title="Latest Announcements" action="View all" onAction={() => onNavigate("announcements")} />
        {aLoading ? <Spinner text="Loading..." /> : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {announcements.slice(0, 3).map((a, i) => (
              <div key={a.id} style={{ padding: "12px 0", borderBottom: i < 2 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
                      <MegaIcon />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>{a.title}</div>
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
    </>
  );
}