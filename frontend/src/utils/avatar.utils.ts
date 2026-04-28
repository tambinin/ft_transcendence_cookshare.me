export const DEFAULT_AVATAR_URL = '/images/users/Default.png';

/**
 * Return absolute URL for an avatar picture, applying a default value if missing.
 * @param avatarUrl - User avatar URL (might be null/undefined/empty)
 * @returns Complete URL to the avatar
 */
export const getAvatarUrl = (avatarUrl?: string | null): string => {
  if (!avatarUrl || avatarUrl.trim() === '') {
    return DEFAULT_AVATAR_URL;
  }
  
  if (avatarUrl === '/default-avatar.png') {
    return DEFAULT_AVATAR_URL;
  }
  
  return avatarUrl;
};

/**
 * Return absolute URL for a media file (picture, etc.)
 * @param avatarUrl - User avatar URL
 * @returns Complete relative or absolute URL to the avatar
 */
export const isDefaultAvatar = (avatarUrl?: string | null): boolean => {
  const normalizedUrl = getAvatarUrl(avatarUrl);
  return normalizedUrl === DEFAULT_AVATAR_URL;
};