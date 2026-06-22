const User         = require("../models/User");
const Leave        = require("../models/Leave");
const Task         = require("../models/Task");
const Announcement = require("../models/Announcement");
const { parseQuery } = require("../services/openaiService");

// Build a Mongo filter object for the User collection from AI filters
function buildUserFilter(f) {
  const q = { deleted: { $ne: true } };
  if (f.status)        q.status        = f.status;
  if (f.role)          q.role          = f.role;
  if (f.dept)          q.dept          = new RegExp(`^${f.dept}$`, "i");
  if (f.payrollStatus) q.payrollStatus = f.payrollStatus;
  if (f.joinedAfter || f.joinedBefore) {
    q.createdAt = {};
    if (f.joinedAfter)  q.createdAt.$gte = new Date(f.joinedAfter);
    if (f.joinedBefore) q.createdAt.$lte = new Date(f.joinedBefore);
  }
  if (f.minSalary || f.maxSalary) {
    q.salary = {};
    if (f.minSalary) q.salary.$gte = f.minSalary;
    if (f.maxSalary) q.salary.$lte = f.maxSalary;
  }
  // Name filter — matches firstName, lastName, or full name
  if (f.name) {
    q.$or = [
      { firstName: new RegExp(f.name, "i") },
      { lastName:  new RegExp(f.name, "i") },
      { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: f.name, options: "i" } } }
    ];
  }
  return q;
}

async function runUsersQuery(filters) {
  const q = buildUserFilter(filters);
  const users = await User.find(q).select("-password").limit(50);
  return users;
}

async function runPayrollQuery(filters) {
  const q = buildUserFilter(filters);
  const users = await User.find(q).select("firstName lastName email dept salary payrollStatus").limit(50);
  return users;
}

async function runLeavesQuery(filters) {
  const leaveMatch = {};
  if (filters.status) leaveMatch.status = filters.status;
  if (filters.type)   leaveMatch.type   = filters.type;
  if (filters.fromDate || filters.toDate) {
    leaveMatch.from = {};
    if (filters.fromDate) leaveMatch.from.$gte = filters.fromDate;
    if (filters.toDate)   leaveMatch.from.$lte = filters.toDate;
  }

  let leaves = await Leave.find(leaveMatch)
    .populate("employeeId", "firstName lastName email dept")
    .limit(100);

  // dept filter after populate
  if (filters.dept) {
    const deptRegex = new RegExp(`^${filters.dept}$`, "i");
    leaves = leaves.filter(l => l.employeeId && deptRegex.test(l.employeeId.dept || ""));
  }

  // name filter after populate
  if (filters.name) {
    const nameRegex = new RegExp(filters.name, "i");
    leaves = leaves.filter(l => {
      if (!l.employeeId) return false;
      const full = `${l.employeeId.firstName} ${l.employeeId.lastName}`;
      return nameRegex.test(full) || nameRegex.test(l.employeeId.firstName) || nameRegex.test(l.employeeId.lastName);
    });
  }

  return leaves.slice(0, 50);
}

async function runTasksQuery(filters) {
  const taskMatch = {};
  if (filters.priority) taskMatch.priority = filters.priority;
  if (typeof filters.done === "boolean") taskMatch.done = filters.done;
  if (filters.tag) taskMatch.tag = new RegExp(`^${filters.tag}$`, "i");

  let tasks = await Task.find(taskMatch)
    .populate("userId", "firstName lastName email dept")
    .limit(100);

  // dept filter after populate
  if (filters.dept) {
    const deptRegex = new RegExp(`^${filters.dept}$`, "i");
    tasks = tasks.filter(t => t.userId && deptRegex.test(t.userId.dept || ""));
  }

  // name filter after populate — "tasks of test employee"
  if (filters.name) {
    const nameRegex = new RegExp(filters.name, "i");
    tasks = tasks.filter(t => {
      if (!t.userId) return false;
      const full = `${t.userId.firstName} ${t.userId.lastName}`;
      return nameRegex.test(full) || nameRegex.test(t.userId.firstName) || nameRegex.test(t.userId.lastName);
    });
  }

  return tasks.slice(0, 50);
}

async function runAnnouncementsQuery(filters) {
  const match = {};
  // filter by title/content keyword if name is provided
  if (filters.name) {
    match.$or = [
      { title:   new RegExp(filters.name, "i") },
      { content: new RegExp(filters.name, "i") },
    ];
  }
  const announcements = await Announcement.find(match)
    .sort({ createdAt: -1 })
    .limit(20);
  return announcements;
}

exports.handleAiQuery = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query is required" });
    }

    const parsed = await parseQuery(query);
    const { module, filters, summary } = parsed;

    let results = [];
    switch (module) {
      case "users":
        results = await runUsersQuery(filters || {});
        break;
      case "leaves":
        results = await runLeavesQuery(filters || {});
        break;
      case "tasks":
        results = await runTasksQuery(filters || {});
        break;
      case "payroll":
        results = await runPayrollQuery(filters || {});
        break;
      case "announcements":
        results = await runAnnouncementsQuery(filters || {});
        break;
      default:
        return res.json({ module: null, summary: summary || "I couldn't understand that request.", results: [] });
    }

    return res.json({ module, summary, count: results.length, results });
  } catch (err) {
    console.error("AI assistant error:", err.message);
    return res.status(500).json({ message: "AI assistant failed", error: err.message });
  }
};