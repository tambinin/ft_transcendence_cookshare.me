import OnlineAvatar from '../../components/OnlineAvatar';
import type { User } from '../../types/user.type';
import type { GamificationData, TabType } from './useProfile';

interface ProfileIdentityProps {
	profileUser: User;
	gamification: GamificationData | null;
	recipesCount: number;
	friendsCount: number;
	isOwnProfile: boolean;
	activeTab: TabType;
	setActiveTab: (tab: TabType) => void;
}

const ProfileIdentity = ({ profileUser, gamification, recipesCount, friendsCount, isOwnProfile, setActiveTab }: ProfileIdentityProps) => (
	<div className="flex flex-col items-center">
		<OnlineAvatar
			userId={profileUser.id}
			avatarUrl={profileUser.avatarUrl}
			username={profileUser.username}
			size="2xl"
			className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
			wrapperClassName="mb-3 rounded-full border-2 border-white/10 bg-gray-800 shadow-lg overflow-visible"
			dotBorderClass="border-[#0d1117]"
		/>

		<h2 className="text-xl md:text-2xl font-bold mb-1 tracking-tight text-white">
			@{profileUser.username}
		</h2>

		{gamification && (
			<div className="flex flex-col items-center gap-2 mt-1 mb-2 w-full max-w-[320px]">
				<span className="px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold tracking-wider">
					Level {gamification.level}
				</span>
				{(() => {
					const currentLevel = gamification.level;
					const xpForCurrentLevel = ((currentLevel - 1) ** 2) * 100;
					const xpForNextLevel = (currentLevel ** 2) * 100;
					const progress = xpForNextLevel > xpForCurrentLevel
						? ((gamification.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
						: 100;
					return (
						<div className="w-full flex items-center gap-2">
							<div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
								<div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
							</div>
							<span className="text-[10px] text-white/40 whitespace-nowrap">{gamification.xp} XP</span>
						</div>
					);
				})()}
				{gamification.badges.length > 0 && (
					<div className="flex gap-2 overflow-x-auto max-w-full py-1 scrollbar-none">
						{gamification.badges.map((ub) => (
							<div key={ub.id} className="group relative shrink-0">
								<div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg" title={ub.badge.name}>
									{ub.badge.iconUrl.startsWith('http') ? (
										<img src={ub.badge.iconUrl} alt={ub.badge.name} loading="lazy" className="w-6 h-6 rounded-full" />
									) : (
										<span>{ub.badge.iconUrl}</span>
									)}
								</div>
								<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
									{ub.badge.name}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		)}

		<div className="flex gap-8 my-4 text-center">
			{isOwnProfile && (
				<button onClick={() => setActiveTab('friends')} className="flex flex-col items-center hover:opacity-80 transition-opacity">
					<span className="text-xl font-bold text-white">{friendsCount}</span>
					<span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Friends</span>
				</button>
			)}
			<button onClick={() => setActiveTab('recipes')} className="flex flex-col items-center hover:opacity-80 transition-opacity">
				<span className="text-xl font-bold text-white">{recipesCount}</span>
				<span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Recipes</span>
			</button>
		</div>
	</div>
);

export default ProfileIdentity;
