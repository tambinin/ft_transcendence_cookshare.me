import OnlineAvatar from '../../components/OnlineAvatar';
import type { BlockedUser, SearchUser } from '../../types/social.type';

interface SettingsBlockedProps {
  blockedUsers: BlockedUser[];
  blockSearchQuery: string;
  setBlockSearchQuery: (v: string) => void;
  blockSearchResults: SearchUser[];
  blockSearchLoading: boolean;
  unblockingId: string | null;
  blockingId: string | null;
  handleBlockUser: (userId: string) => void;
  handleUnblockUser: (userId: string) => void;
}

const SettingsBlocked = ({
  blockedUsers, blockSearchQuery, setBlockSearchQuery,
  blockSearchResults, blockSearchLoading,
  unblockingId, blockingId,
  handleBlockUser, handleUnblockUser,
}: SettingsBlockedProps) => (
  // RESPONSIVE FIX: reduce horizontal padding on mobile
  <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
    {/* Search to block */}
    <div className="relative">
      {/* RESPONSIVE FIX: touch-friendly search input */}
      <input
        type="text"
        placeholder="Search a user to block..."
        value={blockSearchQuery}
        onChange={e => setBlockSearchQuery(e.target.value)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-orange-500/50 transition-colors min-h-[44px]"
      />
      {blockSearchLoading && (
        <span className="absolute right-3 top-3.5 loading loading-spinner loading-xs text-orange-400" />
      )}
    </div>

    {/* Search results */}
    {/* RESPONSIVE FIX: touch-friendly list items and buttons */}
    {blockSearchResults.length > 0 && (
      <div className="space-y-2">
        {blockSearchResults.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg min-h-[48px]">
            <div className="flex items-center gap-3 min-w-0">
              <OnlineAvatar userId={u.id} avatarUrl={u.avatarUrl} username={u.username} size="sm" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <span className="text-sm text-white truncate">{u.username}</span>
            </div>
            <button
              onClick={() => handleBlockUser(u.id)}
              disabled={blockingId === u.id}
              className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50 min-h-[40px] shrink-0 ml-2"
            >
              {blockingId === u.id ? '...' : 'Block'}
            </button>
          </div>
        ))}
      </div>
    )}

    {/* Blocked users list */}
    {/* RESPONSIVE FIX: touch-friendly blocked user items and unblock buttons */}
    {blockedUsers.length === 0 ? (
      <p className="text-sm text-gray-500 text-center py-4">No blocked users.</p>
    ) : (
      <div className="space-y-2">
        {blockedUsers.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg min-h-[48px]">
            <div className="flex items-center gap-3 min-w-0">
              <OnlineAvatar userId={u.id} avatarUrl={u.avatarUrl} username={u.username} size="sm" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className="min-w-0">
                <span className="text-sm text-white truncate block">{u.username}</span>
                <p className="text-[10px] text-gray-500">Blocked {new Date(u.blockedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={() => handleUnblockUser(u.id)}
              disabled={unblockingId === u.id}
              className="px-3 py-2 rounded-lg bg-white/10 text-white/70 text-xs font-bold hover:bg-white/20 transition-colors disabled:opacity-50 min-h-[40px] shrink-0 ml-2"
            >
              {unblockingId === u.id ? '...' : 'Unblock'}
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default SettingsBlocked;
