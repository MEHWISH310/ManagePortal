import { AVATAR_PALETTE, FIXED_AVATAR_COLORS } from "./constants";

export function getAvatarColor(initials) {
  if (FIXED_AVATAR_COLORS[initials]) return FIXED_AVATAR_COLORS[initials];
  const idx =
    (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) %
    AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}