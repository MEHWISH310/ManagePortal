import { useState }          from "react";
import { useAnnouncements }  from "../../shared/hooks/useAnnouncements";
import SectionHeader         from "../../shared/ui/SectionHeader";
import Spinner               from "../../shared/ui/Spinner";

const TAG_OPTIONS = ["HR", "Admin", "Policy", "IT", "Finance", "General"];

export default function AdminAnnouncementsTab() {
  const { announcements, loading, error, handleAdd, handleDelete } = useAnnouncements();
  const [title,  setTitle]  = useState("");
  const [body,   setBody]   = useState("");
  const [tag,    setTag]    = useState("General");

  const submit = () => {
    if (!title.trim()) return;
    handleAdd({ title, body, tags: [tag] });
    setTitle(""); setBody(""); setTag("General");
  };

  if (loading) return <Spinner text="Loading announcements..." />;
  if (error)   return <div className="db-error">Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="db-card">
        <SectionHeader title="Post Announcement" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
            <input
              className="field-input"
              style={{ paddingLeft: 12 }}
              placeholder="Announcement title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <select
              className="db-select"
              value={tag}
              onChange={e => setTag(e.target.value)}
              style={{ minWidth: 120 }}
            >
              {TAG_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <textarea
            className="field-input"
            style={{ paddingLeft: 12, paddingTop: 10, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
            placeholder="Write the full announcement message..."
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="submit-btn"
              style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0 }}
              onClick={submit}
            >
              Post Announcement
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {announcements.map((a) => (
          <div key={a.id} className="db-card" style={{ padding: "1.1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{a.title}</span>
                {a.tags?.map(t => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{a.date}</span>
                <button
                  onClick={() => handleDelete(a.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, lineHeight: 1 }}
                  title="Delete"
                >✕</button>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}