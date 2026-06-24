import { useState, useRef, useEffect } from "react";
import SectionHeader from "../../shared/ui/SectionHeader";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { apiPost, apiGet } from "../../shared/api/apiClient";
import { LeaveIcon, MegaphoneIcon, PayrollIcon, TaskIcon, AlertIcon } from "../../shared/icons/icons";
import Spinner from "../../shared/ui/Spinner";

const ICON_CLS    = { leave: "tp-icon-leave", announce: "tp-icon-announce", payroll: "tp-icon-payroll", task: "tp-icon-task", system: "tp-icon-system" };
const NOTIF_ICONS = { leave: LeaveIcon, announce: MegaphoneIcon, payroll: PayrollIcon, task: TaskIcon, system: AlertIcon };
const TYPES       = ["All", "leave", "announce", "payroll", "task", "system"];
const NOTIF_TYPES = ["leave", "announce", "payroll", "task", "system"];

// ─── Employee Search + Select Component ───────────────────────────────────────
// Works for both single (individual) and multi (group) selection.
// Searches backend on every keystroke with 300ms debounce — never loads all employees.
function EmployeeSearchSelect({ mode, selectedEmps, onChange }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (val) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); setOpen(false); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiGet(`/users/search?q=${encodeURIComponent(val.trim())}&limit=10`);
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const pickEmployee = (emp) => {
    const id = emp._id || emp.id;
    if (mode === "single") {
      onChange([emp]);
      setQuery(`${emp.firstName} ${emp.lastName}`);
      setOpen(false);
      setResults([]);
    } else {
      // multi — avoid duplicates
      if (!selectedEmps.find(e => (e._id || e.id) === id)) {
        onChange([...selectedEmps, emp]);
      }
      setQuery("");
      setResults([]);
      setOpen(false);
    }
  };

  const removeEmployee = (id) => {
    onChange(selectedEmps.filter(e => (e._id || e.id) !== id));
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>

      {/* Selected chips */}
      {selectedEmps.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {selectedEmps.map(emp => (
            <div key={emp._id || emp.id}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, fontSize: 12.5, color: "#1d4ed8", fontWeight: 600 }}>
              {emp.firstName} {emp.lastName}
              <span
                onClick={() => removeEmployee(emp._id || emp.id)}
                style={{ cursor: "pointer", color: "#93c5fd", fontWeight: 700, marginLeft: 2, lineHeight: 1 }}>✕</span>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div style={{ position: "relative" }}>
        <input
          className="field-input"
          style={{ paddingLeft: 36, paddingRight: 36 }}
          placeholder="Search by name, email, phone or employee code..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          autoComplete="off"
        />
        {/* Search icon */}
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, pointerEvents: "none" }}>
          🔍
        </span>
        {/* Loading dots */}
        {loading && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 11 }}>
            searching...
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position: "absolute", zIndex: 200, top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", maxHeight: 260, overflowY: "auto" }}>
          {results.length === 0 && !loading && (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
              No employees found for "{query}"
            </div>
          )}
          {results.map(emp => {
            const id          = emp._id || emp.id;
            const alreadyPicked = selectedEmps.find(e => (e._id || e.id) === id);
            return (
              <div key={id}
                onClick={() => !alreadyPicked && pickEmployee(emp)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: alreadyPicked ? "default" : "pointer", background: alreadyPicked ? "#f8fafc" : "#fff", opacity: alreadyPicked ? 0.55 : 1, borderBottom: "1px solid #f1f5f9", transition: "background 0.12s" }}
                onMouseEnter={ev => { if (!alreadyPicked) ev.currentTarget.style.background = "#f0f7ff"; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = alreadyPicked ? "#f8fafc" : "#fff"; }}
              >
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {emp.email}
                    {emp.phone    ? ` · ${emp.phone}`    : ""}
                    {emp.username ? ` · ${emp.username}` : ""}
                  </div>
                </div>
                {alreadyPicked && (
                  <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>Added ✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function AdminNotificationsTab() {
  const { notifs, loading, error, handleMarkRead, handleMarkAll, handleDelete } = useNotifications();

  const [filter,       setFilter]      = useState("All");
  const [showCompose,  setShowCompose] = useState(false);
  const [title,        setTitle]       = useState("");
  const [sub,          setSub]         = useState("");
  const [type,         setType]        = useState("system");
  const [sendTo,       setSendTo]      = useState("individual");
  const [selectedEmps, setSelectedEmps] = useState([]); // full emp objects (not just ids)
  const [sending,      setSending]     = useState(false);
  const [successMsg,   setSuccessMsg]  = useState("");

  const resetCompose = () => {
    setSelectedEmps([]);
    setSendTo("individual");
    setTitle("");
    setSub("");
    setType("system");
  };

  const submit = async () => {
    if (!title.trim()) return;
    setSending(true);
    try {
      let recipientIds = [];
      if (sendTo === "all")        recipientIds = [];
      if (sendTo === "individual") recipientIds = selectedEmps.slice(0, 1).map(e => e._id || e.id);
      if (sendTo === "group")      recipientIds = selectedEmps.map(e => e._id || e.id);

      await apiPost("/notifications/bulk", { title, sub, type, recipientIds });

      setSuccessMsg(`Notification sent to ${sendTo === "all" ? "everyone" : `${recipientIds.length} employee(s)`}!`);
      resetCompose();
      setShowCompose(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      alert("Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  const unread   = notifs.filter(n => n.unread).length;
  const filtered = filter === "All" ? notifs : notifs.filter(n => n.type === filter);

  // Send button label
  const sendLabel = () => {
    if (sending) return "Sending...";
    if (sendTo === "all") return "Send to All";
    if (sendTo === "individual" && selectedEmps.length === 1)
      return `Send to ${selectedEmps[0].firstName}`;
    if (sendTo === "group" && selectedEmps.length > 0)
      return `Send to ${selectedEmps.length} Employee${selectedEmps.length !== 1 ? "s" : ""}`;
    return "Send";
  };

  const sendDisabled = sending || (sendTo !== "all" && selectedEmps.length === 0);

  if (loading) return <Spinner text="Loading notifications..." />;
  if (error)   return <div style={{ padding: "2rem", color: "#dc2626" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
        {[
          { label: "Total",  val: notifs.length,          color: "#2563eb", bg: "#eff6ff" },
          { label: "Unread", val: unread,                  color: "#d97706", bg: "#fef9ec" },
          { label: "Read",   val: notifs.length - unread,  color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCompose ? "1rem" : 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Send Notification</span>
          <button
            onClick={() => { setShowCompose(o => !o); resetCompose(); }}
            style={{ fontSize: 12.5, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            {showCompose ? "Cancel" : "+ New"}
          </button>
        </div>

        {showCompose && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Send To selector */}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.4px" }}>Send To</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { val: "individual", label: "Individual"        },
                  { val: "group",      label: "Multiple Employees" },
                  { val: "all",        label: "All Employees"      },
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => { setSendTo(opt.val); setSelectedEmps([]); }}
                    style={{ fontSize: 12.5, fontWeight: 600, padding: "7px 16px", borderRadius: 8, border: `1.5px solid ${sendTo === opt.val ? "#2563eb" : "#e2e8f0"}`, background: sendTo === opt.val ? "#eff6ff" : "#f8fafc", color: sendTo === opt.val ? "#2563eb" : "#64748b", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ Search-based employee selector — replaces old scrollable list */}
            {(sendTo === "individual" || sendTo === "group") && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {sendTo === "individual"
                    ? "Select Employee"
                    : `Select Employees${selectedEmps.length > 0 ? ` (${selectedEmps.length} selected)` : ""}`}
                </div>
                <EmployeeSearchSelect
                  mode={sendTo === "individual" ? "single" : "multi"}
                  selectedEmps={selectedEmps}
                  onChange={setSelectedEmps}
                />
              </div>
            )}

            {/* Title, subtitle, type */}
            <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Notification title..." value={title} onChange={e => setTitle(e.target.value)} />
            <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Subtitle (optional)..." value={sub} onChange={e => setSub(e.target.value)} />
            <select className="db-select" value={type} onChange={e => setType(e.target.value)}>
              {NOTIF_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => { setShowCompose(false); resetCompose(); }}
                style={{ padding: "0 16px", height: 38, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "none", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button className="submit-btn"
                style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0, opacity: sendDisabled ? 0.5 : 1 }}
                onClick={submit}
                disabled={sendDisabled}>
                {sendLabel()}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <SectionHeader title="All Notifications" count={`${unread} unread`} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
              {TYPES.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: filter === f ? "#2563eb" : "#f1f5f9", color: filter === f ? "#fff" : "#64748b", textTransform: "capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
            {unread > 0 && (
              <button onClick={handleMarkAll}
                style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(n => {
            const Icon = NOTIF_ICONS[n.type] || AlertIcon;
            return (
              <div key={n._id} onClick={() => handleMarkRead(n._id)}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: n.unread ? "#f8faff" : "#fff", border: `1px solid ${n.unread ? "#bfdbfe" : "#f1f5f9"}`, transition: "background 0.15s" }}>
                <div className={`tp-notif-icon ${ICON_CLS[n.type] || "tp-icon-system"}`}><Icon /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: n.unread ? 700 : 500, color: "#0f172a", marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 3 }}>{n.sub}</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{n.time}</div>
                </div>
                {n.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 4 }} />}
                <button onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 14, padding: 2 }}
                  onMouseEnter={ev => ev.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={ev => ev.currentTarget.style.color = "#cbd5e1"}>✕</button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No notifications found.</div>
          )}
        </div>
      </div>
    </div>
  );
}