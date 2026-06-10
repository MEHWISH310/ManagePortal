export default function Spinner({ text = "Loading..." }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "4rem 0", gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3.5px solid #e2e8f0",
        borderTopColor: "#2563eb",
        animation: "spin 0.75s linear infinite",
      }} />
      <span style={{ fontSize: 13.5, color: "#94a3b8", fontWeight: 500 }}>{text}</span>
    </div>
  );
}