import { getAvatarColor } from "../utils/getAvatarColor";

export default function Avatar({ initials, size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: getAvatarColor(initials),
        color: "#fff",
        fontSize: size < 36 ? 11 : 14,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        letterSpacing: "0.3px",
      }}
    >
      {initials}
    </div>
  );
}