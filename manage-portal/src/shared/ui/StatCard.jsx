export default function StatCard({ label, value, delta, up, sub, Icon, accentBg, accentColor }) {
  return (
    <div className="db-stat-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="db-stat-label">{label}</div>
          <div className="db-stat-val" style={{ marginTop: 6 }}>{value}</div>
        </div>
        {Icon && (
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: accentBg, color: accentColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon />
          </div>
        )}
      </div>

      {delta && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 4,
            marginTop: 10, fontSize: 12, fontWeight: 600,
            color: up === true ? "#16a34a" : up === false ? "#dc2626" : "#64748b",
          }}
        >
          {delta}
        </div>
      )}

      {sub && !delta && (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>{sub}</div>
      )}
    </div>
  );
}