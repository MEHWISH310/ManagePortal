export const ADMIN_LEAVES = [
  { name: "Anjali Gupta", avatar: "AG", type: "Medical", from: "26 May", to: "30 May", days: 5, status: "Pending",  reason: "Scheduled surgery follow-up" },
  { name: "Dev Kapoor",   avatar: "DK", type: "Casual",  from: "28 May", to: "29 May", days: 2, status: "Pending",  reason: "Personal errand" },
  { name: "Sneha Joshi",  avatar: "SJ", type: "Earned",  from: "2 Jun",  to: "6 Jun",  days: 5, status: "Approved", reason: "Family vacation" },
  { name: "Karan Verma",  avatar: "KV", type: "Casual",  from: "20 May", to: "20 May", days: 1, status: "Rejected", reason: "Out of casual balance" },
];

export const MY_LEAVES = [
  { type: "Casual",  from: "2026-03-02", to: "2026-03-02", days: 1, status: "Approved", reason: "Personal work" },
  { type: "Medical", from: "2026-04-10", to: "2026-04-12", days: 3, status: "Approved", reason: "Fever and rest" },
  { type: "Earned",  from: "2026-06-02", to: "2026-06-06", days: 5, status: "Pending",  reason: "Family vacation" },
];

export const LEAVE_BALANCES = [
  { type: "Annual",  total: 24, used: 12, color: "#2563eb", bg: "#eff6ff" },
  { type: "Medical", total: 6,  used: 3,  color: "#16a34a", bg: "#f0fdf4" },
  { type: "Casual",  total: 6,  used: 5,  color: "#d97706", bg: "#fef9ec" },
];