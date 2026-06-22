import { useState, useRef, useEffect } from "react";
import { apiPost } from "../api/apiClient";

// ── Icons ─────────────────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
  </svg>
);
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── Suggestions ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Show inactive employees",
  "Pending leaves from HR",
  "Employees who joined this year",
  "High priority tasks",
  "Employees with pending payroll",
  "Show all announcements",
  "Show all trainings",
  "My notifications",
];

// ── Result Cards ──────────────────────────────────────────────────────────────
function UserCard({ u }) {
  const statusColor = u.status === "Active" ? "#16a34a" : u.status === "On Leave" ? "#b45309" : "#dc2626";
  const statusBg    = u.status === "Active" ? "#f0fdf4" : u.status === "On Leave" ? "#fef9ec" : "#fef2f2";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {(u.firstName?.[0] || "")}{(u.lastName?.[0] || "")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{u.firstName} {u.lastName}</div>
        <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.jobTitle || u.role} · {u.dept}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, background: statusBg, color: statusColor, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{u.status}</span>
    </div>
  );
}

function LeaveCard({ l }) {
  const statusColor = l.status === "Approved" ? "#16a34a" : l.status === "Pending" ? "#b45309" : "#dc2626";
  const statusBg    = l.status === "Approved" ? "#f0fdf4" : l.status === "Pending" ? "#fef9ec" : "#fef2f2";
  return (
    <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{l.employeeId?.firstName} {l.employeeId?.lastName}</span>
        <span style={{ fontSize: 10, fontWeight: 700, background: statusBg, color: statusColor, padding: "2px 7px", borderRadius: 20 }}>{l.status}</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{l.type} · {l.days} day{l.days !== 1 ? "s" : ""} · {l.from} → {l.to}</div>
      {l.employeeId?.dept && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{l.employeeId.dept}</div>}
    </div>
  );
}

function TaskCard({ t }) {
  const priColor = t.priority === "High" ? "#dc2626" : t.priority === "Medium" ? "#b45309" : "#16a34a";
  const priBg    = t.priority === "High" ? "#fef2f2" : t.priority === "Medium" ? "#fef9ec" : "#f0fdf4";
  return (
    <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.done ? "#94a3b8" : "#0f172a", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
        <span style={{ fontSize: 10, fontWeight: 700, background: priBg, color: priColor, padding: "2px 7px", borderRadius: 20 }}>{t.priority}</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>
        {t.userId?.firstName} {t.userId?.lastName}{t.due ? ` · Due: ${t.due}` : ""}{t.done ? " · ✓ Done" : " · Pending"}
      </div>
    </div>
  );
}

function PayrollCard({ u }) {
  const statusColor = u.payrollStatus === "Paid" ? "#16a34a" : u.payrollStatus === "On Hold" ? "#dc2626" : "#b45309";
  const statusBg    = u.payrollStatus === "Paid" ? "#f0fdf4" : u.payrollStatus === "On Hold" ? "#fef2f2" : "#fef9ec";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {(u.firstName?.[0] || "")}{(u.lastName?.[0] || "")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{u.firstName} {u.lastName}</div>
        <div style={{ fontSize: 11, color: "#64748b" }}>{u.dept} · ₹{u.salary?.toLocaleString("en-IN")}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, background: statusBg, color: statusColor, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{u.payrollStatus}</span>
    </div>
  );
}

function AnnouncementCard({ a }) {
  return (
    <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{a.title}</div>
      {a.content && (
        <div style={{ fontSize: 11.5, color: "#64748b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {a.content}
        </div>
      )}
      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 4 }}>
        {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
      </div>
    </div>
  );
}

function TrainingCard({ t }) {
  return (
    <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{t.title}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", whiteSpace: "nowrap", marginLeft: 8 }}>₹{t.price}</span>
      </div>
      {t.description && <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 3 }}>{t.description}</div>}
      <div style={{ fontSize: 11, color: "#94a3b8" }}>
        📅 {t.date}{t.duration ? ` · ⏱ ${t.duration}` : ""}
      </div>
    </div>
  );
}

function NotificationCard({ n }) {
  // Schema: title, sub, type, recipient, readBy[], createdBy, createdAt
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const isRead = Array.isArray(n.readBy) && n.readBy.includes(currentUserId);
  const typeColor = { leave: "#b45309", announce: "#2563eb", payroll: "#7c3aed", task: "#16a34a", system: "#64748b" };
  const color = typeColor[n.type] || "#64748b";
  return (
    <div style={{ padding: "8px 10px", background: isRead ? "#f8fafc" : "#eff6ff", borderRadius: 9, border: `1px solid ${isRead ? "#f1f5f9" : "#bfdbfe"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: isRead ? 500 : 700, color: "#0f172a" }}>{n.title}</div>
        <span style={{ fontSize: 9, fontWeight: 700, background: color + "20", color, padding: "2px 6px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{n.type}</span>
      </div>
      {n.sub && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{n.sub}</div>}
      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 3 }}>
        {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
        {!isRead && <span style={{ marginLeft: 6, background: "#2563eb", color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>UNREAD</span>}
      </div>
    </div>
  );
}

function EnrolledCard({ p }) {
  const u = p.userId;
  const t = p.trainingId;
  return (
    <div style={{ padding: "8px 10px", background: "#f0fdf4", borderRadius: 9, border: "1px solid #bbf7d0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {(u?.firstName?.[0] || "")}{(u?.lastName?.[0] || "")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{u?.firstName} {u?.lastName}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{u?.dept} · {u?.jobTitle}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "2px 7px", borderRadius: 20 }}>Enrolled</span>
      </div>
      {t && <div style={{ fontSize: 11, color: "#64748b", paddingLeft: 36 }}>📚 {t.title} · ₹{t.price} · {t.date}</div>}
    </div>
  );
}

// ── Result List ───────────────────────────────────────────────────────────────
function ResultList({ module, results }) {
  if (!results || results.length === 0)
    return <div style={{ textAlign: "center", padding: "12px 0", color: "#94a3b8", fontSize: 12 }}>No results found.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      {results.map((r, i) => {
        if (module === "leaves")        return <LeaveCard        key={i} l={r} />;
        if (module === "tasks")         return <TaskCard         key={i} t={r} />;
        if (module === "payroll")       return <PayrollCard      key={i} u={r} />;
        if (module === "announcements") return <AnnouncementCard key={i} a={r} />;
        if (module === "training")      return <TrainingCard     key={i} t={r} />;
        if (module === "notifications") return <NotificationCard key={i} n={r} />;
        if (module === "enrolled")      return <EnrolledCard     key={i} p={r} />;
        return                                 <UserCard         key={i} u={r} />;
      })}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
      <div style={{
        maxWidth: "85%", padding: "8px 12px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isUser ? "#2563eb" : "#f1f5f9",
        color: isUser ? "#fff" : "#0f172a", fontSize: 13,
      }}>
        {msg.text}
      </div>
      {msg.results && (
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, paddingLeft: 2 }}>
            {msg.count} result{msg.count !== 1 ? "s" : ""} found
          </div>
          <ResultList module={msg.module} results={msg.results} />
        </div>
      )}
      {msg.error && (
        <div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", borderRadius: 8, padding: "6px 10px", maxWidth: "85%" }}>
          {msg.error}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your AI assistant 👋 Ask me anything about employees, leaves, tasks, payroll, announcements, trainings, or notifications." }
  ]);
  const bottomRef = useRef();
  const inputRef  = useRef();

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (queryText) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const data = await apiPost("/ai-assistant", { query: q });
      if (!data.module) {
        setMessages(prev => [...prev, { role: "assistant", text: data.summary || "I couldn't understand that. Try: 'Show inactive employees' or 'Pending leaves from HR'." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", text: data.summary, module: data.module, results: data.results, count: data.count }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong.", error: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button onClick={() => setOpen(o => !o)} title="AI Assistant"
        style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 20px rgba(37,99,235,0.45)", transition: "transform 0.2s, box-shadow 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.55)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)";   e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.45)"; }}>
        {open ? <CloseIcon /> : <SparkleIcon />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div style={{ position: "fixed", bottom: 92, right: 28, zIndex: 999, width: 370, height: 560, background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e2e8f0", animation: "slideUp 0.2s ease" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SparkleIcon />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Assistant</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>Employees · Leaves · Tasks · Payroll · More</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", gap: 4, padding: "8px 12px", background: "#f1f5f9", borderRadius: "14px 14px 14px 4px" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", animation: `bounce 1s ease ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions — only on first message */}
            {messages.length === 1 && !loading && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    style={{ fontSize: 11.5, fontWeight: 500, padding: "5px 10px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#334155", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#2563eb"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#334155"; }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "center" }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything…" disabled={loading}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#0f172a", background: loading ? "#f8fafc" : "#fff" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: input.trim() && !loading ? "#2563eb" : "#e2e8f0", color: input.trim() && !loading ? "#fff" : "#94a3b8", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce  { 0%,80%,100% { transform:scale(0.6); opacity:0.5; } 40% { transform:scale(1); opacity:1; } }
      `}</style>
    </>
  );
}