const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a query-parsing assistant for an HR management system called ManagePortal.
Your ONLY job is to convert a natural-language request into a structured JSON object.
NEVER reply with explanations, markdown, or extra text — ONLY raw JSON.

Modules and fields:

1. module: "users" — Employees
   filters: status ("Active"|"On Leave"|"Inactive"), role ("admin"|"employee"), dept, payrollStatus ("Paid"|"Pending"|"On Hold"), joinedAfter, joinedBefore (ISO dates), name (string)

2. module: "leaves"
   filters: status ("Pending"|"Approved"|"Rejected"), type ("Casual"|"Medical"|"Earned"), dept, fromDate, toDate, name

3. module: "tasks"
   filters: done (bool), priority ("High"|"Medium"|"Low"), tag, dept, name

4. module: "payroll"
   filters: payrollStatus ("Paid"|"Pending"|"On Hold"), dept, minSalary, maxSalary, name

5. module: "announcements"
   filters: keyword (string — search in title/content)

6. module: "training"
   filters: keyword (string — search in title/description)

7. module: "notifications"
   filters: (none — returns recent notifications)

Always respond in this exact JSON shape:
{
  "module": "users"|"leaves"|"tasks"|"payroll"|"announcements"|"training"|"notifications",
  "filters": { ...only relevant keys... },
  "summary": "short friendly one-line description"
}

Today's date is ${new Date().toISOString().slice(0, 10)}.

If ambiguous or no match: { "module": null, "filters": {}, "summary": "I couldn't understand that request." }
`;

// ── GENERIC WORDS — never treated as a person's name ─────────────────────────
const GENERIC = /^(all|the|me|my|a|an|is|in|on|at|to|of|for|by|show|list|get|fetch|find|display|give|tell|what|who|which|how|inactive|active|deleted|removed|employees?|payroll|leaves?|tasks?|announcements?|training|notifications?|pending|approved|rejected|done|paid|unpaid|high|medium|low|casual|medical|earned|recent|new|latest|this|year|month|week|day|today|management|engineering|hr|finance|design|sales|marketing|operations|general)$/i;

function isGeneric(word) { return GENERIC.test(word.trim()); }
function extractName(q) {
  const patterns = [
    /(?:of|for|by|named?|called?)\s+([a-z][a-z\s]{1,40})$/i,
    /(?:of|for|by|named?|called?)\s+([a-z][a-z\s]{1,30}?)(?:\s+(?:in|from|with|who|and|\bin\b))/i,
    /^show\s+(?:me\s+|the\s+)?([a-z]+\s+[a-z]+)(?:'s)?(?:\s+payroll|\s+salary|\s+leaves?|\s+tasks?|\s+profile)?$/i,
    /^find\s+([a-z]+(?:\s+[a-z]+)?)$/i,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m && m[1]) {
      const name = m[1].trim();
      const words = name.split(/\s+/);
      if (words.length > 0 && !words.every(isGeneric)) return name;
    }
  }
  return null;
}

// ── LOCAL FALLBACK ────────────────────────────────────────────────────────────
function localFallbackParser(query) {
  const q = query.toLowerCase().trim();
  const today = new Date();
  const filters = {};
  let module = null;
  let summary = "";

  // ── Detect module — most specific first ──
  if (/deleted.employ|removed.employ|employ.*deleted/.test(q)) { module = "users"; filters.deleted = true; }
  else if (/enrolled|who (?:paid|joined|registered).*training|employees.*training|training.*employees/.test(q)) module = "enrolled";
  else if (/\bnotification/.test(q))                     module = "notifications";
  else if (/\bannouncement|notice|\bnews\b/.test(q)) module = "announcements";
  else if (/\btraining|course|workshop/.test(q))     module = "training";
  else if (/\bleave|casual|medical|earned/.test(q))  module = "leaves";
  else if (/\btask/.test(q))                         module = "tasks";
  else if (/\bpayroll|salary/.test(q))               module = "payroll";
  else                                                module = "users";

  // ── User status ──
  if (/\binactive\b/.test(q))                                        { module = "users"; filters.status = "Inactive"; }
  if (/\bon leave\b/.test(q) && module !== "leaves")                 { module = "users"; filters.status = "On Leave"; }
  if (/\bonly active\b|\bactive employees\b|\bactive staff\b/.test(q)) { module = "users"; filters.status = "Active"; }

  // ── Leave filters ──
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
    if (/\bcompleted\b|\bdone\b/.test(q))   filters.done     = true;
    if (/\bpending\b|\bnot done\b/.test(q)) filters.done     = false;
    if (/\bhigh\b/.test(q))                 filters.priority = "High";
    if (/\bmedium\b/.test(q))               filters.priority = "Medium";
    if (/\blow\b/.test(q))                  filters.priority = "Low";
  }

  // ── Payroll filters ──
  if (module === "payroll") {
    if (/\bunpaid\b|\bpending\b/.test(q)) filters.payrollStatus = "Pending";
    if (/\bpaid\b/.test(q))               filters.payrollStatus = "Paid";
    if (/\bon hold\b/.test(q))            filters.payrollStatus = "On Hold";
  }

  // ── Role — detect admin/moderator/employee queries ──
  if (/\badmin(s)?\b/.test(q) && !/announcement|task|leave|payroll|notif/.test(q)) {
    module = "users"; filters.role = "admin";
  }
  if (/\bmoderator(s)?\b/.test(q)) {
    module = "users"; filters.role = "moderator";
  }

  // ── Department ──
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
  for (const [kw, dept] of deptMap) {
    if (new RegExp(kw, "i").test(q)) { filters.dept = dept; break; }
  }

  // ── Keyword / date filter for announcements / training / enrolled ──
  if (module === "announcements" || module === "training") {
    // keyword
    const kwMatch = q.match(/(?:about|regarding|related to)\s+([a-z][a-z\s]{1,40})$/i);
    if (kwMatch) filters.keyword = kwMatch[1].trim();

    // past / upcoming trainings
    if (/past|already happened|completed|done|finished|over|previous/.test(q)) {
      filters.trainingPast = true;
    }
    if (/upcoming|future|scheduled|coming|next/.test(q)) {
      filters.trainingUpcoming = true;
    }

    // date filter for training — "on 25 june", "on june 25", "on 2026-06-25"
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
                     january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
    const dateMatch = q.match(/(?:on|date|scheduled on|of)\s+(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)/i)
                   || q.match(/(?:on|date|scheduled on|of)\s+([a-z]+)\s+(\d{1,2})/i)
                   || q.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && module === "training") {
      let day, month, year = new Date().getFullYear();
      if (dateMatch[0].match(/\d{4}-\d{2}-\d{2}/)) {
        filters.trainingDate = dateMatch[1];
      } else {
        const d1 = parseInt(dateMatch[1]), d2 = parseInt(dateMatch[2]);
        const m1 = months[dateMatch[1]?.toLowerCase()], m2 = months[dateMatch[2]?.toLowerCase()];
        if (!isNaN(d1) && m2 !== undefined)      { day = d1; month = m2; }
        else if (m1 !== undefined && !isNaN(d2)) { day = d2; month = m1; }
        if (day && month !== undefined) {
          const pad = n => String(n).padStart(2,"0");
          filters.trainingDate = `${year}-${pad(month+1)}-${pad(day)}`;
        }
      }
    }
  } else if (module === "enrolled") {
    // extract training name: "enrolled in AI training" → "AI"
    const enrollMatch = q.match(/(?:enrolled in|paid for|registered for|joined)\s+([a-z][a-z\s]{1,40}?)(?:\s+training|\s+course|\s+workshop)?$/i)
                     || q.match(/(?:employees?|who).*(?:in|for)\s+([a-z][a-z\s]{1,40}?)(?:\s+training|\s+course)?$/i);
    if (enrollMatch) filters.trainingKeyword = enrollMatch[1].trim();
  } else {
    // ── Name filter for employees / leaves / tasks / payroll ──
    const name = extractName(q);
    if (name) filters.name = name;
  }

  // ── Date filters ──
  if (/this year|joined this year|new this year/.test(q)) {
    filters.joinedAfter  = new Date(today.getFullYear(), 0, 1).toISOString();
    filters.joinedBefore = new Date(today.getFullYear(), 11, 31).toISOString();
    if (module === "users" || module === "payroll") {} else module = "users";
  }
  if (/this month|joined this month/.test(q)) {
    filters.joinedAfter  = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    filters.joinedBefore = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
    if (module !== "leaves") module = "users";
  }
  if (/last 30 days|recent(?:ly)?/.test(q) && module === "users") {
    const d = new Date(); d.setDate(d.getDate() - 30);
    filters.joinedAfter = d.toISOString();
  }

  // ── Out-of-scope check — agar koi HR keyword nahi hai to null return karo ──
  const hrKeywords = /employ|staff|worker|team|leave|task|payroll|salary|salary|announce|notif|training|course|admin|moderator|dept|department|hr|role|status|active|inactive|deleted|enrolled|join|hired/i;
  if (!hrKeywords.test(q) && !filters.name && !filters.dept && !filters.status && !filters.role && !filters.deleted) {
    return { module: null, filters: {}, summary: "I can only help with HR-related queries like employees, leaves, tasks, payroll, announcements, or training." };
  }

  // ── Build summary ──
  const labelMap = { users: "employees", leaves: "leaves", tasks: "tasks", payroll: "payroll", announcements: "announcements", training: "trainings", notifications: "notifications", enrolled: "enrolled employees" };
  const moduleLabel = labelMap[module] || module;
  const parts = [];
  if (filters.name)          parts.push(filters.name);
  if (filters.keyword)       parts.push(`"${filters.keyword}"`);
  if (filters.status)        parts.push(filters.status);
  if (filters.role)          parts.push(filters.role + "s only");
  if (filters.dept)          parts.push("dept: " + filters.dept);
  if (filters.type)          parts.push(filters.type);
  if (typeof filters.done === "boolean") parts.push(filters.done ? "completed" : "pending");
  if (filters.priority)      parts.push(filters.priority + " priority");
  if (filters.payrollStatus) parts.push(filters.payrollStatus);
  if (filters.joinedAfter)   parts.push("joined recently");

  summary = parts.length
    ? `Showing ${moduleLabel} — ${parts.join(", ")}`
    : `Showing all ${moduleLabel}`;

  return { module, filters, summary };
}

// ── Main export ───────────────────────────────────────────────────────────────
async function parseQuery(userQuery) {
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
    const parsed = JSON.parse(completion.choices[0].message.content);
    parsed._source = "openai";
    return parsed;
  } catch (err) {
    console.warn("[AI] OpenAI unavailable, using local fallback:", err.message);
    const parsed = localFallbackParser(userQuery);
    parsed._source = "local";
    return parsed;
  }
}

module.exports = { parseQuery };