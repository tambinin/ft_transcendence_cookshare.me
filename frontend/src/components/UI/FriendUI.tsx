import { useState } from "react";
import { RiUserUnfollowLine, RiMessengerLine, RiUserFollowLine } from "react-icons/ri";
import { FiCheck, FiX } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import OnlineAvatar from "../OnlineAvatar";
import logger from "../../utils/logger";

export interface FriendUIProps {
    id: string;
    username: string;
    avatarUrl: string | null;
    isOnline?: boolean;
    followersCount?: number;
    recipesCount?: number;
    type: 'friend' | 'follower' | 'following' | 'friend-request';
    requestId?: string;
    onRemoveFriend?: (friendId: string) => Promise<void>;
    onFollow?: (userId: string) => Promise<void>;
    onUnfollow?: (userId: string) => Promise<void>;
    onAcceptRequest?: (requestId: string) => Promise<void>;
    onRejectRequest?: (requestId: string) => Promise<void>;
}

const FriendUI = ({
    id,
    username,
    avatarUrl,
    isOnline = false,
    followersCount,
    recipesCount,
    type,
    requestId,
    onRemoveFriend,
    onFollow,
    onUnfollow,
    onAcceptRequest,
    onRejectRequest,
}: FriendUIProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isRemoved, setIsRemoved] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleAction = async (action: () => Promise<void>) => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            await action();
        } catch (error) {
            logger.error('[FriendUI] Action error:', error);
            setErrorMsg('Action échouée. Réessayez.');
            setTimeout(() => setErrorMsg(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    if (isRemoved) return null;

    return (
        <div
            className="group relative flex flex-col 
                items-center justify-between
                border border-white/5
                rounded-2xl p-5
                bg-[var(--cook-bg)]
                hover:border-orange-500/30
                hover:shadow-xl hover:shadow-orange-500/10
                hover:-translate-y-1
                transition-all duration-300 ease-out
                overflow-hidden h-full"
        >
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-duration-500" />
            <div className="flex flex-col items-center w-full relative z-10">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <OnlineAvatar
                        userId={id}
                        avatarUrl={avatarUrl}
                        username={username}
                        isOnline={isOnline}
                        size="xl"
                        className="relative w-24 h-24 rounded-full border-4 border-[#18191a] shadow-lg object-cover group-hover:scale-105 transition-transform duration-300"
                        dotBorderClass="border-[#18191a]"
                    />
                </div>

                <h3 className="text-lg font-bold text-white
                    tracking-tight mb-2 text-center truncate w-full px-2"
                    title={username}
                >
                    {username}
                </h3>

                {recipesCount !== undefined && (
                    <div className="flex items-center gap-2 bg-white/5 
                        px-3 py-1.5 rounded-full mb-4 border border-white/5">
                        <span className="text-orange-400 font-bold text-sm w-4 text-center">{recipesCount}</span>
                        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">recettes</span>
                    </div>
                )}

                {followersCount !== undefined && (
                    <div className="flex items-center gap-2 bg-white/5 
                        px-3 py-1.5 rounded-full mb-4 border border-white/5">
                        <span className="text-orange-400 font-bold text-sm">{followersCount}</span>
                        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">abonnés</span>
                    </div>
                )}

                <div className={`px-3 py-1 rounded-full text-xs font-medium mb-4 ${type === 'friend' ? 'bg-green-500/20 text-green-400' :
                        type === 'follower' ? 'bg-blue-500/20 text-blue-400' :
                            type === 'following' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-orange-500/20 text-orange-400'
                    }`}>
                    {type === 'friend' ? 'Ami' :
                        type === 'follower' ? 'Abonné' :
                            type === 'following' ? 'Suivi' :
                                'Demande en attente'}
                </div>
            </div>

            {errorMsg && (
                <p className="text-red-400 text-xs text-center mb-2 relative z-10">{errorMsg}</p>
            )}

            <div className="flex items-center gap-2 w-full relative z-10 mt-auto">
                {type === 'friend-request' && requestId && (
                    <>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleAction(async () => {
                                await onAcceptRequest?.(requestId);
                                setIsRemoved(true);
                            })}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                                bg-green-500/20 text-green-400 hover:bg-green-500/30
                                transition-all duration-300 font-semibold text-sm disabled:opacity-50"
                        >
                            <FiCheck className="text-lg" />
                            <span>Accepter</span>
                        </button>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleAction(async () => {
                                await onRejectRequest?.(requestId);
                                setIsRemoved(true);
                            })}
                            className="p-2.5 rounded-xl bg-red-500/20 text-red-400 
                                hover:bg-red-500/30 transition-all duration-300"
                            title="Refuser"
                        >
                            <FiX size={20} />
                        </button>
                    </>
                )}

                {type === 'friend' && (
                    <>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleAction(async () => {
                                await onRemoveFriend?.(id);
                                setIsRemoved(true);
                            })}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                                bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 
                                ring-1 ring-inset ring-white/10 hover:ring-red-500/20
                                transition-all duration-300 font-semibold text-sm disabled:opacity-50"
                        >
                            <RiUserUnfollowLine className="text-lg" />
                            <span>Retirer</span>
                        </button>
                        <NavLink
                            to={`/messenger/${id}`}
                            className="p-2.5 rounded-xl bg-white/5 text-slate-400 
                                hover:bg-white/10 hover:text-white 
                                ring-1 ring-inset ring-white/10 hover:ring-white/20
                                transition-all duration-300"
                            title="Send a message"
                        >
                            <RiMessengerLine size={20} />
                        </NavLink>
                    </>
                )}

                {type === 'follower' && (
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleAction(async () => {
                            await onFollow?.(id);
                        })}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                            bg-orange-500/20 text-orange-400 hover:bg-orange-500/30
                            transition-all duration-300 font-semibold text-sm disabled:opacity-50"
                    >
                        <RiUserFollowLine className="text-lg" />
                        <span>Suivre en retour</span>
                    </button>
                )}

                {type === 'following' && (
                    <>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleAction(async () => {
                                await onUnfollow?.(id);
                                setIsRemoved(true);
                            })}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                                bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 
                                ring-1 ring-inset ring-white/10 hover:ring-red-500/20
                                transition-all duration-300 font-semibold text-sm disabled:opacity-50"
                        >
                            <RiUserUnfollowLine className="text-lg" />
                            <span>Ne plus suivre</span>
                        </button>
                        <NavLink
                            to={`/messenger/${id}`}
                            className="p-2.5 rounded-xl bg-white/5 text-slate-400 
                                hover:bg-white/10 hover:text-white 
                                ring-1 ring-inset ring-white/10 hover:ring-white/20
                                transition-all duration-300"
                            title="Send a message"
                        >
                            <RiMessengerLine size={20} />
                        </NavLink>
                    </>
                )}
            </div>
        </div>
    );
}

export default FriendUI;
