import { useState, useEffect } from "react";
import { apiGet } from "../../shared/api/apiClient";
import { formatSalary } from "../../shared/utils/formatSalary";
import SectionHeader from "../../shared/ui/SectionHeader";
import Avatar        from "../../shared/ui/Avatar";
import Spinner       from "../../shared/ui/Spinner";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

const DEPT_COLORS = ["#2563eb","#16a34a","#f59e0b","#9333ea","#0891b2","#dc2626","#0d9488","#7c3aed","#ea580c","#0284c7"];
const LEAVE_COLORS = { Casual:"#16a34a", Medical:"#2563eb", Earned:"#9333ea", Annual:"#f59e0b", Unpaid:"#dc2626" };
const ROLE_COLORS  = { admin:"#2563eb", moderator:"#9333ea", employee:"#16a34a", user:"#16a34a" };

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
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fontFamily="inherit">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function StatBox({ label, value, sub, color = "#2563eb", bg = "#eff6ff" }) {
  return (
    <div className="db-stat-card">
      <div className="db-stat-label">{label}</div>
      <div className="db-stat-val" style={{ marginTop: 6, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function ReportsTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    apiGet("/reports")
      .then(d  => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading reports..." />;
  if (error)   return <div className="db-error">Error: {error}</div>;
  if (!data)   return null;

  const { summary, deptData, roleData, statusData, leaveBreakdown, payrollTrend, topEarners } = data;
  const maxPayroll = Math.max(...payrollTrend.map(b => b.val), 1);
  const yAxisWidth = Math.min(Math.max(...(deptData.map(d => d.label.length) || [6])) * 7 + 12, 160);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        <StatBox label="Total Payroll"        value={formatSalary(summary.totalPayroll)} sub="All employees"        color="#2563eb" bg="#eff6ff" />
        <StatBox label="Avg. Cost / Employee" value={formatSalary(summary.avgSalary)}    sub="Across all depts"     color="#9333ea" bg="#fdf4ff" />
        <StatBox label="Leave Days Taken"     value={summary.totalLeaveDays}              sub="Approved leaves only" color="#d97706" bg="#fef9ec" />
        <StatBox label="Task Completion"
          value={`${summary.totalTasks ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%`}
          sub={`${summary.completedTasks} of ${summary.totalTasks} tasks`}
          color="#16a34a" bg="#f0fdf4"
        />
      </div>

      {/* ── Row 1: Payroll trend + Dept headcount ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1rem" }}>

        {/* Payroll trend bar */}
        <div className="db-card">
          <SectionHeader title="Monthly Payroll Trend (₹L)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={payrollTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11.5, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(37,99,235,0.07)" }} />
              <Bar dataKey="val" name="₹L" radius={[6,6,0,0]} maxBarSize={52}>
                {payrollTrend.map((b, i) => <Cell key={i} fill={b.isCurrent ? "#2563eb" : "#bfdbfe"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Role pie */}
        <div className="db-card" style={{ display: "flex", flexDirection: "column" }}>
          <SectionHeader title="Role Distribution" />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roleData} dataKey="count" nameKey="role" cx="50%" cy="50%"
                  outerRadius={72} paddingAngle={0} strokeWidth={0}
                  labelLine={false} label={PieLabel}>
                  {roleData.map((e, i) => <Cell key={i} fill={ROLE_COLORS[e.role] || "#94a3b8"} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => v} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Dept bar + Status pie ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1rem" }}>

        {/* Dept horizontal bar */}
        <div className="db-card">
          <SectionHeader title="Headcount by Department" />
          <ResponsiveContainer width="100%" height={Math.max(deptData.length * 36 + 20, 220)}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="label" type="category" tick={<DeptTick />} axisLine={false} tickLine={false} width={yAxisWidth} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="count" name="Employees" radius={[0,6,6,0]} maxBarSize={22}
                background={{ fill: "#f8fafc", radius: [0,6,6,0] }}>
                {deptData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div className="db-card" style={{ display: "flex", flexDirection: "column" }}>
          <SectionHeader title="Employee Status" />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={76}
                  paddingAngle={0} strokeWidth={0} labelLine={false} label={PieLabel}>
                  {statusData.map((e, i) => (
                    <Cell key={i} fill={e.status === "Active" ? "#16a34a" : e.status === "On Leave" ? "#f59e0b" : "#ef4444"} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: Leave breakdown + Top earners ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Leave breakdown */}
        <div className="db-card">
          <SectionHeader title="Leave Breakdown by Type" />
          {leaveBreakdown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No leave data yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.75rem" }}>
              {leaveBreakdown.map(l => (
                <div key={l.type} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: LEAVE_COLORS[l.type] || "#64748b" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{l.type}</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{l.total}</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span><span style={{ color: "#16a34a", fontWeight: 600 }}>{l.approved} approved</span></span>
                    <span>{l.pending} pending · {l.totalDays} days total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top earners */}
        <div className="db-card">
          <SectionHeader title="Top Earners" />
          {topEarners.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No data yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topEarners.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: i === 0 ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "#f8fafc", borderRadius: 10, border: `1px solid ${i === 0 ? "#bfdbfe" : "#f1f5f9"}` }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "#2563eb" : "#e2e8f0", color: i === 0 ? "#fff" : "#64748b", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <Avatar initials={e.avatar} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>{e.dept}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#2563eb" : "#0f172a" }}>
                    {formatSalary(e.salary)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Task completion summary ── */}
      <div className="db-card">
        <SectionHeader title="Task Summary" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
          {[
            { label: "Total Tasks",  val: summary.totalTasks,     color: "#2563eb", bg: "#eff6ff" },
            { label: "Completed",    val: summary.completedTasks, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Pending",      val: summary.pendingTasks,   color: "#d97706", bg: "#fef9ec" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${s.color}22` }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}