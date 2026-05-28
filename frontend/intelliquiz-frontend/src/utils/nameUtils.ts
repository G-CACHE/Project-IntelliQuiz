/**
 * Utility for "Smart Names" which encode an avatar ID into the participant's name.
 * Format: "DisplayName|avatarId"
 */

export const AVATAR_SEPARATOR = '|';

/**
 * Formats a display name and avatar ID into a smart name string.
 */
export function formatSmartName(name: string, avatarId: string | null): string {
  if (!avatarId) return name;
  return `${name}${AVATAR_SEPARATOR}${avatarId}`;
}

/**
 * Parses a smart name into its components.
 */
export function parseSmartName(fullName: string | undefined): { name: string; avatarId: string | null } {
  if (!fullName) return { name: '?', avatarId: null };
  
  const parts = fullName.split(AVATAR_SEPARATOR);
  if (parts.length < 2) {
    return { name: fullName, avatarId: null };
  }
  
  return {
    name: parts[0],
    avatarId: parts[1]
  };
}

/**
 * Gets the full path for an avatar ID.
 */
export function getAvatarPath(avatarId: string | null): string | null {
  if (!avatarId) return null;
  return `/avatars/${avatarId}`;
}
