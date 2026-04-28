import { useFeedRefresh } from '../contexts/feed.context';
import { getAvatarUrl } from '../utils/avatar.utils';

/**
 * OnlineAvatar — Reusable avatar with a real-time online status indicator (green dot).
 *
 * Use this everywhere you display a user's avatar to get consistent, live online
 * status across the entire app (search, comments, notifications, profiles, etc.).
 *
 * The green dot is driven by the global FeedContext online-user map, which is
 * kept in sync via WebSocket `user_status` events + API hydration seeding.
 */

export type OnlineAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface OnlineAvatarProps {
	userId: string;
	avatarUrl: string | null | undefined;
	username?: string;
	/** Predefined size presets */
	size?: OnlineAvatarSize;
	/** Override: Tailwind classes for the img (e.g. "w-10 h-10") */
	className?: string;
	/** Extra classes on the outer wrapper */
	wrapperClassName?: string;
	/** Show a colored ring around the avatar */
	ring?: boolean;
	/** Ring color class override */
	ringClass?: string;
	/** Override online status (skip context lookup) — useful when the parent already knows */
	isOnline?: boolean;
	/** Hide the dot entirely (e.g. for own avatar in settings) */
	hideDot?: boolean;
	/** Border color matching the background for the dot cutout */
	dotBorderClass?: string;
}

const sizeMap: Record<OnlineAvatarSize, { img: string; dot: string; dotBorder: string }> = {
	xs: { img: 'w-6 h-6', dot: 'w-2 h-2', dotBorder: 'border' },
	sm: { img: 'w-8 h-8', dot: 'w-2.5 h-2.5', dotBorder: 'border-[1.5px]' },
	md: { img: 'w-10 h-10', dot: 'w-3 h-3', dotBorder: 'border-2' },
	lg: { img: 'w-12 h-12', dot: 'w-3.5 h-3.5', dotBorder: 'border-2' },
	xl: { img: 'w-24 h-24', dot: 'w-5 h-5', dotBorder: 'border-4' },
	'2xl': { img: 'w-28 h-28', dot: 'w-5 h-5', dotBorder: 'border-[3px]' },
};

const OnlineAvatar = ({
	userId,
	avatarUrl,
	username = '',
	size = 'md',
	className,
	wrapperClassName,
	ring = false,
	ringClass = 'ring-1 ring-white/10',
	isOnline: isOnlineOverride,
	hideDot = false,
	dotBorderClass,
}: OnlineAvatarProps) => {
	const { isUserOnline } = useFeedRefresh();
	const online = isOnlineOverride !== undefined ? isOnlineOverride : isUserOnline(userId);
	const s = sizeMap[size];
	const imgClasses = className || `${s.img} rounded-full object-cover`;
	const borderClass = dotBorderClass || 'border-[#0d1117]';

	return (
		<div className={`relative flex-shrink-0 ${wrapperClassName || ''}`}>
			<img
				src={getAvatarUrl(avatarUrl)}
				alt={username}
				loading="lazy"
				className={`${imgClasses} ${ring ? ringClass : ''}`}
			/>
			{!hideDot && online && (
				<div
					className={`absolute bottom-0 right-0 ${s.dot} bg-green-500 ${s.dotBorder} ${borderClass} rounded-full`}
				/>
			)}
		</div>
	);
};

export default OnlineAvatar;
