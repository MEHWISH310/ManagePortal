const User         = require("../models/User");
const Leave        = require("../models/Leave");
const Task         = require("../models/Task");
const Announcement = require("../models/Announcement");
const Training     = require("../models/Training");
const Notification = require("../models/Notification");
const Payment      = require("../models/Payment");
const { parseQuery } = require("../services/openaiService");

// ── User filter builder ───────────────────────────────────────────────────────
function buildUserFilter(f) {
  // if explicitly asking for deleted employees, show them; otherwise exclude
  const q = f.deleted ? { deleted: true } : { deleted: { $ne: true } };
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
  if (f.name) {
    q.$or = [
      { firstName: new RegExp(f.name, "i") },
      { lastName:  new RegExp(f.name, "i") },
      { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: f.name, options: "i" } } },
    ];
  }
  return q;
}

// ── Module runners ────────────────────────────────────────────────────────────
async function runUsersQuery(filters) {
  return User.find(buildUserFilter(filters)).select("-password").limit(50);
}

async function runPayrollQuery(filters) {
  return User.find(buildUserFilter(filters))
    .select("firstName lastName email dept salary payrollStatus")
    .limit(50);
}

async function runLeavesQuery(filters) {
  const match = {};
  if (filters.status)   match.status = filters.status;
  if (filters.type)     match.type   = filters.type;
  if (filters.fromDate || filters.toDate) {
    match.from = {};
    if (filters.fromDate) match.from.$gte = filters.fromDate;
    if (filters.toDate)   match.from.$lte = filters.toDate;
  }

  let leaves = await Leave.find(match)
    .populate("employeeId", "firstName lastName email dept")
    .limit(100);

  if (filters.dept) {
    const rx = new RegExp(`^${filters.dept}$`, "i");
    leaves = leaves.filter(l => l.employeeId && rx.test(l.employeeId.dept || ""));
  }
  if (filters.name) {
    const rx = new RegExp(filters.name, "i");
    leaves = leaves.filter(l => {
      if (!l.employeeId) return false;
      const full = `${l.employeeId.firstName} ${l.employeeId.lastName}`;
      return rx.test(full) || rx.test(l.employeeId.firstName) || rx.test(l.employeeId.lastName);
    });
  }
  return leaves.slice(0, 50);
}

async function runTasksQuery(filters) {
  const match = {};
  if (filters.priority)              match.priority = filters.priority;
  if (typeof filters.done === "boolean") match.done = filters.done;
  if (filters.tag)                   match.tag = new RegExp(`^${filters.tag}$`, "i");

  let tasks = await Task.find(match)
    .populate("userId", "firstName lastName email dept")
    .limit(100);

  if (filters.dept) {
    const rx = new RegExp(`^${filters.dept}$`, "i");
    tasks = tasks.filter(t => t.userId && rx.test(t.userId.dept || ""));
  }
  if (filters.name) {
    const rx = new RegExp(filters.name, "i");
    tasks = tasks.filter(t => {
      if (!t.userId) return false;
      const full = `${t.userId.firstName} ${t.userId.lastName}`;
      return rx.test(full) || rx.test(t.userId.firstName) || rx.test(t.userId.lastName);
    });
  }
  return tasks.slice(0, 50);
}

async function runAnnouncementsQuery(filters) {
  const match = {};
  if (filters.keyword) {
    match.$or = [
      { title:   new RegExp(filters.keyword, "i") },
      { content: new RegExp(filters.keyword, "i") },
    ];
  }
  return Announcement.find(match).sort({ createdAt: -1 }).limit(20);
}

async function runTrainingQuery(filters) {
  const match = {};
  if (filters.keyword) {
    match.$or = [
      { title:       new RegExp(filters.keyword, "i") },
      { description: new RegExp(filters.keyword, "i") },
    ];
  }
  // date filter — training.date is stored as "YYYY-MM-DD" string
  if (filters.trainingDate) {
    match.date = filters.trainingDate;
  }
  return Training.find(match).sort({ createdAt: -1 }).limit(20);
}

async function runNotificationsQuery(filters, userId) {
  // recipient: null means broadcast to all, or specific user
  const match = {
    $or: [
      { recipient: null },
      ...(userId ? [{ recipient: userId }] : []),
    ]
  };
  return Notification.find(match)
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(20);
}

async function runEnrolledQuery(filters) {
  // filters.trainingKeyword — search training by name
  let trainingIds = null;
  if (filters.trainingKeyword) {
    const trainings = await Training.find({
      $or: [
        { title:       new RegExp(filters.trainingKeyword, "i") },
        { description: new RegExp(filters.trainingKeyword, "i") },
      ]
    }).select("_id");
    trainingIds = trainings.map(t => t._id);
  }

  const paymentMatch = { status: "paid" };
  if (trainingIds) paymentMatch.trainingId = { $in: trainingIds };

  const payments = await Payment.find(paymentMatch)
    .populate("userId",     "firstName lastName email dept jobTitle status")
    .populate("trainingId", "title price date")
    .limit(50);

  return payments;
}

// ── Main handler ──────────────────────────────────────────────────────────────
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
      case "training":
        results = await runTrainingQuery(filters || {});
        break;
      case "notifications":
        results = await runNotificationsQuery(filters || {}, req.user?._id);
        break;
      case "enrolled":
        results = await runEnrolledQuery(filters || {});
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