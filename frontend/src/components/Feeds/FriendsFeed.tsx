import { useState, useEffect } from 'react';
import FriendUI from '../UI/FriendUI';
import socialService from '../../services/social.service';
import { useAuth } from '../../contexts/auth.context';
import { useFeedRefresh } from '../../contexts/feed.context';
import type { Friend } from '../../types/social.type';
import { RiWifiOffLine } from 'react-icons/ri';
import { onNotification, onUserStatusChange } from '../../services/socket.service';

const FriendsFeed = () => {
    const { isAuthenticated } = useAuth();
    const { seedOnlineStatus } = useFeedRefresh();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const fetchFriends = async () => {
        setIsLoading(true);
        setHasError(false);
        try {
            const res = await socialService.getMyFriends();
            const data = (res.data ?? res as unknown as Friend[]);
            const list = Array.isArray(data) ? data : [];
            setFriends(list);
            // Seed online status for all friends so OnlineAvatar works globally
            for (const f of list) {
                seedOnlineStatus(f.id, f.isOnline);
            }
        } catch {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }
        fetchFriends();
    }, [isAuthenticated]);

    useEffect(() => {
        const off = onNotification((data) => {
            if (data.type === 'FRIEND_REQUEST_ACCEPTED') {
                fetchFriends();
            }
        });
        return off;
    }, []);

    useEffect(() => {
        const off = onUserStatusChange(({ userId, isOnline }) => {
            setFriends(prev => prev.map(f => f.id === userId ? { ...f, isOnline } : f));
        });
        return off;
    }, []);

    if (isLoading) {
        return (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex flex-col items-center border border-white/5 rounded-2xl p-5 bg-[var(--cook-bg)]">
                        <div className="w-24 h-24 rounded-full bg-white/10 mb-4" />
                        <div className="h-5 w-28 bg-white/10 rounded mb-4" />
                        <div className="flex gap-2 w-full">
                            <div className="flex-1 h-10 bg-white/10 rounded-xl" />
                            <div className="w-10 h-10 bg-white/10 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="p-4 rounded-full bg-orange-500/10">
                    <RiWifiOffLine className="text-4xl text-orange-400" />
                </div>
                <p className="text-white/60 text-base">Couldn't load your friends. If you have any.</p>
                <button
                    onClick={fetchFriends}
                    className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all text-sm font-semibold"
                >
Try again
                </button>
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="text-center space-y-3 p-8 border border-white/5 rounded-2xl bg-white/[0.02]">
                <h3 className="text-white/80 text-lg font-semibold">0 friends. Yes, zero.</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-white/40 text-sm">Even your Wi-Fi has more connections than you.</span>
                    <span className="text-white/25 text-xs">Try to cook something incredible, maybe that will attract people.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {friends.map((friend) => (
                <FriendUI
                    key={friend.id}
                    id={friend.id}
                    username={friend.username}
                    avatarUrl={friend.avatarUrl}
                    isOnline={friend.isOnline}
                    type="friend"
                    onRemoveFriend={async () => {
                        await socialService.removeFriend(friend.id);
                        setFriends(prev => prev.filter(f => f.id !== friend.id));
                    }}
                />
            ))}
        </div>
    );
}

export default FriendsFeed;
