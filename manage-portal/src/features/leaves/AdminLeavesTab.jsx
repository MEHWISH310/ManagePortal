import { useState, useEffect } from "react";
import SectionHeader from "../../shared/ui/SectionHeader";
import StatusBadge   from "../../shared/ui/StatusBadge";
import Avatar        from "../../shared/ui/Avatar";
import Spinner       from "../../shared/ui/Spinner";
import { fetchLeaves, updateLeave } from "../../shared/api/leavesApi";

const CheckIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const XIcon     = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

export default function AdminLeavesTab() {
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchLeaves()
      .then(data => {
        // Map backend response to UI shape
        const mapped = data.map(l => ({
          _id:    l._id,
          name:   l.name || (l.employeeId?.firstName
                    ? `${l.employeeId.firstName} ${l.employeeId.lastName}`
                    : "Unknown"),
          avatar: l.name
                    ? `${l.name.split(" ")[0]?.[0] || ""}${l.name.split(" ")[1]?.[0] || ""}`.toUpperCase()
                    : "??",
          type:   l.type,
          from:   l.from,
          to:     l.to,
          days:   l.days,
          reason: l.reason,
          status: l.status,
        }));
        setLeaves(mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const act = async (id, action) => {
    try {
      await updateLeave(id, { status: action });
      setLeaves(ls => ls.map(l => l._id === id ? { ...l, status: action } : l));
    } catch (err) {
      console.error("Update leave failed:", err.message);
    }
  };

  const pending = leaves.filter(l => l.status === "Pending").length;

  if (loading) return <Spinner text="Loading leave requests..." />;
  if (error)   return <div className="db-error">Error: {error}</div>;

  return (
    <div className="db-card">
      <SectionHeader title="Leave Requests" count={`${pending} pending`} />
      {leaves.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>
          No leave requests yet.
        </div>
      ) : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Employee</th><th>Type</th><th>Duration</th><th>Reason</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar initials={l.avatar} size={30} />
                      <span className="db-td-bold">{l.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>{l.type}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{l.from} – {l.to}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{l.days} day{l.days > 1 ? "s" : ""}</div>
                  </td>
                  <td style={{ fontSize: 12.5, color: "#64748b", maxWidth: 200 }}>{l.reason}</td>
                  <td><StatusBadge label={l.status} /></td>
                  <td>
                    {l.status === "Pending" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="db-act-btn db-act-approve" onClick={() => act(l._id, "Approved")}><CheckIcon /> Approve</button>
                        <button className="db-act-btn db-act-reject"  onClick={() => act(l._id, "Rejected")}><XIcon /> Reject</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}