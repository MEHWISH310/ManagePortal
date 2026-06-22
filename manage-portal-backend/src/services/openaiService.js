const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a query-parsing assistant for an HR management system called ManagePortal.
Your ONLY job is to convert a natural-language request into a structured JSON object.
NEVER reply with explanations, markdown, or extra text — ONLY raw JSON.

The system has these modules and fields:

1. module: "users"   (Employees)
   filters can include:
   - status: "Active" | "On Leave" | "Inactive"
   - role: "admin" | "employee"
   - dept: string (e.g. "HR", "Engineering", "Finance", "Design", "Sales", "Marketing", "Operations", "Product Management", "General")
   - payrollStatus: "Paid" | "Pending" | "On Hold"
   - joinedAfter: ISO date string
   - joinedBefore: ISO date string

2. module: "leaves"
   filters can include:
   - status: "Pending" | "Approved" | "Rejected"
   - type: "Casual" | "Medical" | "Earned"
   - dept: string
   - fromDate / toDate: ISO date strings

3. module: "tasks"
   filters can include:
   - done: true | false
   - priority: "High" | "Medium" | "Low"
   - tag: string
   - dept: string

4. module: "payroll"
   filters can include:
   - payrollStatus: "Paid" | "Pending" | "On Hold"
   - dept: string
   - minSalary: number
   - maxSalary: number

Always respond in this exact JSON shape:
{
  "module": "users" | "leaves" | "tasks" | "payroll",
  "filters": { ...only relevant keys... },
  "summary": "a short, friendly one-line description of what you searched for"
}

Today's date is ${new Date().toISOString().slice(0, 10)}.

If the request is ambiguous or doesn't match any module, respond with:
{ "module": null, "filters": {}, "summary": "I couldn't understand that request." }
`;

// ── LOCAL FALLBACK — keyword-based parser (no OpenAI needed) ──────────────────
function localFallbackParser(query) {
  const q = query.toLowerCase();
  const today = new Date();
  const filters = {};
  let module = null;
  let summary = "";

  // ── Detect module (order matters — most specific first) ──
  const isAnnouncement = /\bannouncement|notice|news|post/.test(q);
  const isLeave        = /\bleave|casual|medical|earned/.test(q);
  const isTask         = /\btask/.test(q);
  const isPayroll      = /\bpayroll|salary/.test(q);

  if (isAnnouncement) module = "announcements";
  else if (isLeave)   module = "leaves";
  else if (isTask)    module = "tasks";
  else if (isPayroll) module = "payroll";
  else                module = "users"; // default — employees

  // ── User status — only when clearly about employees ──
  if (/\binactive\b/.test(q))  { module = "users"; filters.status = "Inactive"; }
  if (/\bon leave\b/.test(q))  { module = "users"; filters.status = "On Leave"; }
  // "show active employees" — only set Active if "active" is explicit AND no other status set
  if (/\bonly active\b|\bactive employees\b|\bactive staff\b/.test(q)) {
    module = "users"; filters.status = "Active";
  }

  // ── Leave status ──
  if (module === "leaves") {
    if (/\bpending\b/.test(q))  filters.status = "Pending";
    if (/\bapproved\b/.test(q)) filters.status = "Approved";
    if (/\brejected\b/.test(q)) filters.status = "Rejected";
    if (/\bcasual\b/.test(q))   filters.type   = "Casual";
    if (/\bmedical\b/.test(q))  filters.type   = "Medical";
    if (/\bearned\b/.test(q))   filters.type   = "Earned";
  }

  // ── Task filters ──
  if (module === "tasks") {
    if (/\bcompleted\b|\bdone\b/.test(q))    filters.done     = true;
    if (/\bpending\b|\bnot done\b/.test(q))  filters.done     = false;
    if (/\bhigh\b/.test(q))                  filters.priority = "High";
    if (/\bmedium\b/.test(q))                filters.priority = "Medium";
    if (/\blow\b/.test(q))                   filters.priority = "Low";
  }

  // ── Payroll filters ──
  if (module === "payroll") {
    if (/\bunpaid\b|\bpending\b/.test(q))  filters.payrollStatus = "Pending";
    if (/\bpaid\b/.test(q))                filters.payrollStatus = "Paid";
    if (/\bon hold\b/.test(q))             filters.payrollStatus = "On Hold";
  }

  // ── Role — only when explicitly asked ──
  // "show admins" / "list admins" — NOT triggered by "employees" or "all employees"
  if (/\bshow admins\b|\blist admins\b|\ball admins\b|\bonly admins\b/.test(q)) {
    module = "users"; filters.role = "admin";
  }

  // ── Department detection — order matters (specific/longer first) ──
  const deptMap = [
    ["product management", "Product Management"],
    ["engineering",        "Engineering"],
    ["\\bhr\\b",           "HR"],
    ["finance",            "Finance"],
    ["design",             "Design"],
    ["sales",              "Sales"],
    ["marketing",          "Marketing"],
    ["operations",         "Operations"],
    ["management",         "Management"],
    ["general",            "General"],
  ];
  for (const [keyword, dept] of deptMap) {
    if (new RegExp(keyword, "i").test(q)) { filters.dept = dept; break; }
  }

  // ── Name filter — "of X" / "for X" / "named X" ──
  // Matches: "payroll of test employee", "show karan sharma", "find priya"
  const namePatterns = [
    /(?:of|for|named?|called?)\s+([a-z][a-z\s]{1,40})$/i,           // "payroll of test employee"
    /(?:of|for|named?|called?)\s+([a-z][a-z\s]{1,40}?)(?:\s+(?:in|from|with|who|and|))/i,
    /^show\s+(?:me\s+)?([a-z]+\s+[a-z]+)(?:\s+payroll|\s+salary|\s+leave|\s+task)?$/i, // "show test employee"
    /^find\s+([a-z]+(?:\s+[a-z]+)?)$/i,                              // "find priya"
  ];
  for (const pattern of namePatterns) {
    const m = q.match(pattern);
    if (m && m[1] && m[1].trim().length > 1) {
      // exclude generic words
      const generic = /^(all|the|me|my|inactive|active|employees?|payroll|leaves?|tasks?)$/i;
      const name = m[1].trim();
      if (!generic.test(name)) { filters.name = name; break; }
    }
  }

  // ── Date filters ──
  if (/this year|joined this year|new this year/.test(q)) {
    filters.joinedAfter  = new Date(today.getFullYear(), 0, 1).toISOString();
    filters.joinedBefore = new Date(today.getFullYear(), 11, 31).toISOString();
    module = "users";
  }
  if (/this month|joined this month/.test(q)) {
    filters.joinedAfter  = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    filters.joinedBefore = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
    module = "users";
  }
  if (/last 30 days|recent/.test(q)) {
    const d = new Date(); d.setDate(d.getDate() - 30);
    filters.joinedAfter = d.toISOString();
    module = "users";
  }

  // ── Build summary ──
  const moduleLabel = module === "users" ? "employees" : module === "announcements" ? "announcements" : module;
  const parts = [];
  if (filters.name)          parts.push(filters.name);           // name pehle
  if (filters.status)        parts.push(filters.status);
  if (filters.role)          parts.push(filters.role + "s only");
  if (filters.dept)          parts.push("dept: " + filters.dept);
  if (filters.type)          parts.push(filters.type);
  if (typeof filters.done === "boolean") parts.push(filters.done ? "completed" : "pending");
  if (filters.priority)      parts.push(filters.priority + " priority");
  if (filters.payrollStatus) parts.push(filters.payrollStatus + " payroll");
  if (filters.joinedAfter)   parts.push("joined recently");

  summary = parts.length
    ? `Showing ${moduleLabel} — ${parts.join(", ")}`
    : `Showing all ${moduleLabel}`;

  return { module, filters, summary };
}

// ── Main export — tries OpenAI, falls back to local parser ───────────────────
async function parseQuery(userQuery) {
  // Try OpenAI first
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userQuery },
      ],
      temperature: 0,
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);
    parsed._source = "openai";
    return parsed;

  } catch (err) {
    // OpenAI failed (no credits, network, etc.) — use local fallback
    console.warn("[AI] OpenAI unavailable, using local fallback:", err.message);
    const parsed = localFallbackParser(userQuery);
    parsed._source = "local";
    return parsed;
  }
}

module.exports = { parseQuery };