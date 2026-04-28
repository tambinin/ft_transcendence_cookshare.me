import { NavLink } from 'react-router-dom';
import { MdGridOn } from 'react-icons/md';
import { FiUsers } from 'react-icons/fi';
import { RiMessengerLine } from 'react-icons/ri';
import OnlineAvatar from '../../components/OnlineAvatar';
import RecipeUI from '../../components/RecipeUI';
import type { RecipeSummary } from '../../types/recipe.type';
import type { Friend } from '../../types/social.type';
import type { TabType } from './useProfile';

interface ProfileTabsProps {
	activeTab: TabType;
	setActiveTab: (tab: TabType) => void;
	isOwnProfile: boolean;
	recipes: RecipeSummary[];
	friends: Friend[];
}

const ProfileTabs = ({ activeTab, setActiveTab, isOwnProfile, recipes, friends }: ProfileTabsProps) => {
	return (
	<>
		{/* RESPONSIVE FIX: touch-friendly tab buttons */}
		<div className="flex border-b border-white/10 mt-6 sm:mt-8 mb-4">
			<button
				onClick={() => setActiveTab('recipes')}
				className={`flex-1 pb-3 flex justify-center items-center transition-colors min-h-[48px] ${activeTab === 'recipes' ? 'border-b-2 border-orange-500 text-white' : 'border-b-2 border-transparent text-gray-500 hover:text-white'}`}
			>
				<MdGridOn size={24} />
			</button>
			{isOwnProfile && (
				<button
					onClick={() => setActiveTab('friends')}
					className={`flex-1 pb-3 flex justify-center items-center transition-colors min-h-[48px] ${activeTab === 'friends' ? 'border-b-2 border-orange-500 text-white' : 'border-b-2 border-transparent text-gray-500 hover:text-white'}`}
				>
					<FiUsers size={24} />
				</button>
			)}
		</div>

		{activeTab === 'recipes' && (
			<div>
				{recipes.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-gray-500">
						<MdGridOn size={48} className="mb-4 opacity-30" />
						<p className="text-sm">No recipes published</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
						{recipes.map((recipe) => (
							<RecipeUI key={recipe.id} recipe={recipe} />
						))}
					</div>
				)}
			</div>
		)}

		{activeTab === 'friends' && (
			<div>
				{friends.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-gray-500">
						<FiUsers size={48} className="mb-4 opacity-30" />
						<p className="text-sm">No friends yet</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
						{friends.map((friend) => (
							<div
								key={friend.id}
								className="group relative flex flex-col items-center justify-between border border-white/5 rounded-2xl p-5 bg-(--cook-bg) hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden h-full"
							>
								<div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
								<div className="flex flex-col items-center w-full relative z-10">
									<div className="relative mb-4">
										<div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
										<OnlineAvatar
											userId={friend.id}
											avatarUrl={friend.avatarUrl}
											username={friend.username}
											isOnline={friend.isOnline}
											size="xl"
											className="relative w-24 h-24 rounded-full border-4 border-[#18191a] shadow-lg object-cover group-hover:scale-105 transition-transform duration-300"
											dotBorderClass="border-[#18191a]"
										/>
									</div>
									<h3 className="text-lg font-bold text-white tracking-tight mb-4 text-center truncate w-full px-2" title={friend.username}>
										{friend.username}
									</h3>
								</div>

								<div className="flex items-center gap-2 w-full relative z-10 mt-auto">
									<NavLink
										to={`/profile/${friend.id}`}
										className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white ring-1 ring-inset ring-white/10 hover:ring-white/20 transition-all duration-300 font-semibold text-sm"
									>
										<span>View Profile</span>
									</NavLink>
									<NavLink
										to={`/messenger/${friend.id}`}
										className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white ring-1 ring-inset ring-white/10 hover:ring-white/20 transition-all duration-300"
										title="Send a message"
									>
										<RiMessengerLine size={20} />
									</NavLink>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		)}
	</>
	);
};

export default ProfileTabs;
