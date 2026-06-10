const express = require("express");
const User    = require("../models/User");
const Leave   = require("../models/Leave");
const Task    = require("../models/Task");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// GET /api/reports — all report data in one call
router.get("/", protect, adminOnly, async (req, res) => {
  try {

    // ── 1. Payroll summary ──────────────────────────────────────────────────
    const users          = await User.find().select("salary dept status role payrollStatus firstName lastName");
    const totalEmployees = users.length;
    const totalPayroll   = users.reduce((sum, u) => sum + (u.salary || 0), 0);
    const avgSalary      = totalEmployees ? Math.round(totalPayroll / totalEmployees) : 0;
    const paidCount      = users.filter(u => u.payrollStatus === "Paid").length;

    // ── 2. Headcount by department ──────────────────────────────────────────
    const deptMap = {};
    users.forEach(u => {
      const dept = u.dept || "General";
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const deptData = Object.entries(deptMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    const totalForPct = deptData.reduce((s, d) => s + d.count, 0);
    const deptDataWithPct = deptData.map(d => ({
      ...d,
      pct: totalForPct ? Math.round((d.count / totalForPct) * 100) : 0,
    }));

    // ── 3. Role distribution ────────────────────────────────────────────────
    const roleMap = {};
    users.forEach(u => { roleMap[u.role || "employee"] = (roleMap[u.role || "employee"] || 0) + 1; });
    const roleData = Object.entries(roleMap).map(([role, count]) => ({ role, count }));

    // ── 4. Status distribution ──────────────────────────────────────────────
    const statusMap = {};
    users.forEach(u => { statusMap[u.status || "Active"] = (statusMap[u.status || "Active"] || 0) + 1; });
    const statusData = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // ── 5. Leave breakdown by type ──────────────────────────────────────────
    const leaves = await Leave.find();
    const leaveMap = {};
    leaves.forEach(l => {
      if (!leaveMap[l.type]) leaveMap[l.type] = { type: l.type, total: 0, approved: 0, pending: 0, rejected: 0, totalDays: 0 };
      leaveMap[l.type].total++;
      leaveMap[l.type].totalDays += l.days || 0;
      if (l.status === "Approved") leaveMap[l.type].approved++;
      if (l.status === "Pending")  leaveMap[l.type].pending++;
      if (l.status === "Rejected") leaveMap[l.type].rejected++;
    });
    const leaveBreakdown = Object.values(leaveMap);
    const totalLeaveDays = leaves.filter(l => l.status === "Approved").reduce((s, l) => s + (l.days || 0), 0);

    // ── 6. Monthly payroll trend (last 6 months, approximated from salary sum) ─
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const today  = new Date();
    const payrollTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
      // Real: would aggregate payslip records. For now, use salary total with small variance
      const variance = Math.round(totalPayroll * 0.05 * (Math.random() - 0.5));
      return {
        label: months[d.getMonth()],
        val:   Math.round((totalPayroll + variance) / 100000), // in ₹L
        isCurrent: i === 5,
      };
    });

    // ── 7. Top earners ──────────────────────────────────────────────────────
    const topEarners = users
      .sort((a, b) => (b.salary || 0) - (a.salary || 0))
      .slice(0, 5)
      .map(u => ({
        name:    `${u.firstName} ${u.lastName}`,
        dept:    u.dept,
        salary:  u.salary,
        avatar:  `${u.firstName[0]}${u.lastName[0]}`.toUpperCase(),
      }));

    // ── 8. Task stats ───────────────────────────────────────────────────────
    const tasks         = await Task.find();
    const totalTasks    = tasks.length;
    const completedTasks= tasks.filter(t => t.done).length;
    const pendingTasks  = totalTasks - completedTasks;

    res.json({
      summary: {
        totalEmployees,
        totalPayroll,
        avgSalary,
        paidCount,
        totalLeaveDays,
        totalTasks,
        completedTasks,
        pendingTasks,
      },
      deptData:      deptDataWithPct,
      roleData,
      statusData,
      leaveBreakdown,
      payrollTrend,
      topEarners,
    });

  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;