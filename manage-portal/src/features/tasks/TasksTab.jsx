import { useState }  from "react";
import { useTasks }  from "../../shared/hooks/useTasks";
import SectionHeader from "../../shared/ui/SectionHeader";
import Spinner from "../../shared/ui/Spinner";

const PRIORITY_COLOR = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
const PRIORITY_BG    = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f0fdf4" };

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function formatDue(due) {
  if (!due || due === "—") return "—";
  const d = new Date(due);
  if (isNaN(d)) return due;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function TasksTab() {
  const { tasks, loading, error, handleAdd, handleToggle, handleDelete } = useTasks();
  const [title,    setTitle]    = useState("");
  const [priority, setPriority] = useState("Medium");
  const [due,      setDue]      = useState("");
  const [tag,      setTag]      = useState("HR");
  const [filter,   setFilter]   = useState("All");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = () => {
    if (!title.trim()) {
      setErrorMsg("Task title is required.");
      return;
    }
    setErrorMsg("");
    handleAdd({ title, priority, due: due || "—", tag });
    setTitle(""); setDue("");
  };

  if (loading) return <Spinner text="Loading tasks..." />;
  if (error)   return <div className="db-error">Error: {error}</div>;

  const filtered  = tasks.filter(t =>
    filter === "All"     ? true :
    filter === "Pending" ? !t.done :
    t.done
  );
  const pending   = tasks.filter(t => !t.done).length;
  const completed = tasks.filter(t => t.done).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
        {[
          { label: "Total Tasks", val: tasks.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Pending",     val: pending,       color: "#d97706", bg: "#fef9ec" },
          { label: "Completed",   val: completed,     color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="db-card">
        <SectionHeader title="Add New Task" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, marginBottom: 10 }}>
          <input
            className="field-input"
            style={{ paddingLeft: 12, borderColor: errorMsg ? "#ef4444" : undefined }}
            placeholder="Task title..."
            value={title}
            onChange={e => { setTitle(e.target.value); if (errorMsg) setErrorMsg(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          <select className="db-select" value={priority} onChange={e => setPriority(e.target.value)}>
            {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
          </select>
          <input
            className="field-input"
            style={{ paddingLeft: 12 }}
            type="date"
            value={due}
            onChange={e => setDue(e.target.value)}
          />
        </div>
        {errorMsg && (
          <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <span>⚠</span> {errorMsg}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="submit-btn"
            style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0 }}
            onClick={submit}
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <SectionHeader title="My Tasks" count={`${pending} pending`} />
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Pending", "Completed"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "none",
                  cursor: "pointer",
                  background: filter === f ? "#2563eb" : "#f1f5f9",
                  color:      filter === f ? "#fff"    : "#64748b",
                  transition: "all 0.15s",
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "#94a3b8", fontSize: 13 }}>
              No tasks found.
            </div>
          )}
          {filtered.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 10,
                background: t.done ? "#f8fafc" : "#fff",
                border: "1px solid #f1f5f9",
                opacity: t.done ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <button
                onClick={() => handleToggle(t.id)}
                style={{
                  width: 20, height: 20, borderRadius: 6, border: "none", cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: t.done ? "#2563eb" : "#e2e8f0",
                  color: "#fff", transition: "background 0.15s",
                }}
              >
                {t.done && <CheckIcon />}
              </button>

              <div style={{ width: 7, height: 7, borderRadius: "50%", background: PRIORITY_COLOR[t.priority], flexShrink: 0 }} />

              <span style={{
                flex: 1, fontSize: 13.5, fontWeight: 500,
                color: t.done ? "#94a3b8" : "#0f172a",
                textDecoration: t.done ? "line-through" : "none",
              }}>
                {t.title}
              </span>

              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority],
              }}>
                {t.priority}
              </span>

              <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                {t.due !== "—" ? `Due ${formatDue(t.due)}` : "—"}
              </span>

              <button
                onClick={() => handleDelete(t.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                title="Delete task"
              >✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}