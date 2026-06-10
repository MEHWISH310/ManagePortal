import { useAnnouncements } from "../../shared/hooks/useAnnouncements";
import Spinner from "../../shared/ui/Spinner";

export default function EmployeeAnnouncementsTab() {
  const { announcements, loading, error } = useAnnouncements();

  if (loading) return <Spinner text="Loading announcements..." />;
  if (error)   return <div className="db-error">Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {announcements.map((a) => (
        <div key={a.id} className="db-card" style={{ padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{a.title}</span>
              {a.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>
                  {tag}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", marginTop: 2 }}>{a.date}</span>
          </div>
          <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>{a.body}</p>
        </div>
      ))}
    </div>
  );
}