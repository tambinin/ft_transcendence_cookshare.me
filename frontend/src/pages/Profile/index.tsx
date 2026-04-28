import { FaArrowLeft } from 'react-icons/fa';
import { useProfile } from './useProfile';
import ProfileSkeleton from './ProfileSkeleton';
import ProfileIdentity from './ProfileIdentity';
import ProfileActions from './ProfileActions';
import ProfileTabs from './ProfileTabs';

const Profile = () => {
	const s = useProfile();

	if (s.loading) return <ProfileSkeleton />;

	if (s.error || !s.profileUser) {
		return (
			<div className="min-h-screen bg-(--cook-bg) text-white/90 flex flex-col items-center justify-center gap-4">
				<p className="text-red-400 text-lg">{s.error || 'Profile not found'}</p>
				<button onClick={() => s.navigate(-1)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm">
					← Back
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-(--cook-bg) text-white/90">
			<div className="sticky top-0 z-40 bg-(--cook-bg)/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center">
				<button onClick={() => s.navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 z-10">
					<FaArrowLeft size={18} />
				</button>
				<div className="absolute inset-x-0 flex justify-center pointer-events-none">
					<h1 className="text-base md:text-lg font-bold text-white/90 pointer-events-auto">Profile</h1>
				</div>
				<div className="w-10 h-10 invisible" />
			</div>

			{/* RESPONSIVE FIX: reduce horizontal padding on mobile, add bottom padding for bottom nav */}
			<div className="max-w-5xl mx-auto px-2 sm:px-4 pt-4 sm:pt-6 pb-20 md:pb-12">
				<ProfileIdentity
					profileUser={s.profileUser}
					gamification={s.gamification}
					recipesCount={s.recipes.length}
					friendsCount={s.friendsCount}
					isOwnProfile={!!s.isOwnProfile}
					activeTab={s.activeTab}
					setActiveTab={s.setActiveTab}
				/>

				{s.actionError && (
					<p className="text-red-400 text-sm mb-2 animate-pulse text-center">{s.actionError}</p>
				)}

				{!s.isOwnProfile && (
					<div className="flex justify-center">
						<ProfileActions
							id={s.id}
							actionLoading={s.actionLoading}
							isFriend={s.isFriend}
							pendingRequest={s.pendingRequest}
							sentRequest={s.sentRequest}
							isBlocked={s.isBlocked}
							blockLoading={s.blockLoading}
							onAddFriend={s.handleAddFriend}
							onCancelRequest={s.handleCancelRequest}
							onRemoveFriend={s.handleRemoveFriend}
							onConfirmFriend={s.handleConfirmFriend}
							onToggleBlock={s.handleToggleBlock}
						/>
					</div>
				)}

				<ProfileTabs
					activeTab={s.activeTab}
					setActiveTab={s.setActiveTab}
					isOwnProfile={!!s.isOwnProfile}
					recipes={s.recipes}
					friends={s.friends}
				/>
			</div>
		</div>
	);
};

export default Profile;
