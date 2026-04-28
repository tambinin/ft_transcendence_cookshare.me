import { useEffect, useState } from 'react';
import socialService from '../../services/social.service';
import type { FriendRequest } from '../../types/social.type';
import { RiMailCloseLine } from 'react-icons/ri';
import { onNotification } from '../../services/socket.service';
import { useFeedRefresh } from '../../contexts/feed.context';
import FriendUI from '../UI/FriendUI';

const InvitationFeed = () => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const { isUserOnline } = useFeedRefresh();

    const fetchRequests = async () => {
        setIsLoading(true);
        setHasError(false);
        try {
            const res = await socialService.getMyFriendRequests();
            const pending = (res.data ?? res as unknown as FriendRequest[]);
            setRequests(Array.isArray(pending) ? pending.filter(r => r.status === 'PENDING') : []);
        } catch {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        const off = onNotification((data) => {
            if (data.type === 'FRIEND_REQUEST' || data.type === 'FRIEND_REQUEST_ACCEPTED') {
                fetchRequests();
            }
        });
        return off;
    }, []);

    if (isLoading) {
        return (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex flex-col items-center border border-white/5 rounded-2xl p-5 bg-[var(--cook-bg)]">
                        <div className="w-24 h-24 rounded-full bg-white/10 mb-4" />
                        <div className="h-5 w-28 bg-white/10 rounded mb-4" />
                        <div className="flex gap-2 w-full">
                            <div className="flex-1 h-10 bg-white/10 rounded-xl" />
                            <div className="flex-1 h-10 bg-white/10 rounded-xl" />
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
                    <RiMailCloseLine className="text-4xl text-orange-400" />
                </div>
                <p className="text-white/60 text-base">Unable to load invitations right now.</p>
                <button
                    onClick={fetchRequests}
                    className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all text-sm font-semibold"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="p-5 rounded-full bg-white/5 mb-2">
                    <RiMailCloseLine className="text-5xl text-orange-400/60" />
                </div>
                <h3 className="text-white/80 text-lg font-semibold">No invitations</h3>
                <p className="text-white/40 text-sm text-center max-w-md leading-relaxed">
                    Your inbox is emptier than a bachelor's fridge on a Sunday night.
                    <br />
                    <span className="text-white/25 text-xs">Share some recipes, maybe someone will want to be your friend.</span>
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {requests.map((request) => {
                const sender = request.sender;
                if (!sender) return null;
                return (
                    <FriendUI
                        key={request.id}
                        id={sender.id}
                        username={sender.username}
                        avatarUrl={sender.avatarUrl}
                        isOnline={isUserOnline(sender.id)}
                        type="friend-request"
                        requestId={request.id}
                        onAcceptRequest={async (reqId: string) => {
                            await socialService.acceptFriendRequest(reqId);
                            setRequests(prev => prev.filter(r => r.id !== reqId));
                        }}
                        onRejectRequest={async (reqId: string) => {
                            await socialService.rejectFriendRequest(reqId);
                            setRequests(prev => prev.filter(r => r.id !== reqId));
                        }}
                    />
                );
            })}
        </div>
    );
};

export default InvitationFeed;
