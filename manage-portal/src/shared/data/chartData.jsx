export const BAR_DATA = [
  { label: "Jan", val: 152 },
  { label: "Feb", val: 160 },
  { label: "Mar", val: 158 },
  { label: "Apr", val: 178 },
  { label: "May", val: 184 },
  { label: "Jun", val: 171 },
];

export const DEPT_DATA = [
  { label: "Engineering", count: 98, pct: 40 },
  { label: "Sales",       count: 52, pct: 21 },
  { label: "HR",          count: 30, pct: 12 },
  { label: "Finance",     count: 38, pct: 15 },
  { label: "Design",      count: 30, pct: 12 },
];

export const MY_PAYSLIPS = [
  { month: "May 2025", basic: "₹80,000", allow: "₹15,000", ded: "₹8,500", net: "₹86,500", status: "Paid", pf: "₹3,840", tax: "₹4,660" },
  { month: "Apr 2025", basic: "₹80,000", allow: "₹15,000", ded: "₹8,500", net: "₹86,500", status: "Paid", pf: "₹3,840", tax: "₹4,660" },
  { month: "Mar 2025", basic: "₹78,000", allow: "₹14,500", ded: "₹8,300", net: "₹84,200", status: "Paid", pf: "₹3,744", tax: "₹4,556" },
  { month: "Feb 2025", basic: "₹78,000", allow: "₹14,500", ded: "₹8,300", net: "₹84,200", status: "Paid", pf: "₹3,744", tax: "₹4,556" },
];

export const MY_TASKS = [
  { title: "Complete Q2 performance review", priority: "High",   due: "28 May", done: false, tag: "HR" },
  { title: "Submit project cost estimate",   priority: "High",   due: "27 May", done: false, tag: "Finance" },
  { title: "Review onboarding documents",    priority: "Medium", due: "30 May", done: true,  tag: "Admin" },
  { title: "Update skill assessment form",   priority: "Low",    due: "5 Jun",  done: false, tag: "HR" },
  { title: "Team retrospective notes",       priority: "Medium", due: "29 May", done: true,  tag: "Team" },
];

export const NOTIFS_ADMIN = [
  { type: "leave",    title: "Anjali Gupta applied for Medical Leave", sub: "26 May – 30 May · 5 days",         time: "2m ago",    unread: true  },
  { type: "announce", title: "Q2 Appraisal Cycle Begins",             sub: "Posted by HR team",                 time: "1h ago",    unread: true  },
  { type: "payroll",  title: "May payroll processed successfully",     sub: "₹18.4L disbursed to 248 employees", time: "3h ago",    unread: true  },
  { type: "leave",    title: "Dev Kapoor requested Casual Leave",      sub: "28 May – 29 May · 2 days",          time: "5h ago",    unread: true  },
  { type: "announce", title: "Office closed 29th May (Holiday)",       sub: "Posted by Admin",                   time: "Yesterday", unread: false },
  { type: "payroll",  title: "Apr payroll report available",           sub: "Download from Reports section",     time: "2 days ago",unread: false },
];

export const NOTIFS_EMP = [
  { type: "payroll",  title: "May payslip is ready",                    sub: "Net pay: ₹86,500 · Credited 1 Jun", time: "1h ago",    unread: true  },
  { type: "leave",    title: "Your Earned Leave was approved",          sub: "2 Jun – 6 Jun · 5 days",            time: "3h ago",    unread: true  },
  { type: "task",     title: "Task due today: Q2 performance review",   sub: "Priority: High",                    time: "8h ago",    unread: true  },
  { type: "announce", title: "Q2 Appraisal Cycle Begins",               sub: "Posted by HR team",                 time: "Yesterday", unread: false },
  { type: "system",   title: "New Work From Home policy effective June", sub: "Review updated policy document",    time: "2 days ago",unread: false },
];

export const DEPT_COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#0891b2"];