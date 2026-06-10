export default function SectionHeader({ title, count, action, onAction, extra }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: "1.1rem",
      width: "100%",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</span>
        {count !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            background: "#eff6ff", color: "#2563eb",
            padding: "2px 8px", borderRadius: 20,
          }}>
            {count}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {extra}
        {action && (
          <button className="db-link-btn" onClick={onAction}>{action}</button>
        )}
      </div>
    </div>
  );
}