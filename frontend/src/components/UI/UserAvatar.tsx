import React from 'react';
import { getAvatarUrl } from '../../utils/avatar.utils';

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string;
  size?: string;
  className?: string;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  username = 'User',
  size = 'w-10 h-10',
  className = '',
  onClick
}) => {
  const src = getAvatarUrl(avatarUrl);

  return (
    <img
      src={src}
      alt={`Avatar de ${username}`}
      className={`rounded-full object-cover ${size} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      loading="lazy"
    />
  );
};

export default UserAvatar;