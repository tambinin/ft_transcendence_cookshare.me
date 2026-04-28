import { useState, useEffect, useRef } from 'react';
import { AiOutlineMessage } from "react-icons/ai";
import { NavLink } from "react-router-dom";
import { FiMessageCircle, FiArrowRight } from "react-icons/fi";
import { useChatContext } from '../../contexts/chat.context';
import OnlineAvatar from '../OnlineAvatar';

const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return '';
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const MessageUI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { unreadCount, conversations } = useChatContext();

    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", closeMenu);
        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full transition-all ${isOpen ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 bg-white/5 hover:bg-white/10'}`}
            >
                <AiOutlineMessage size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed right-2 top-16 sm:top-20 px-4 w-[calc(100vw-16px)] sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:w-[400px] md:w-[450px] bg-[var(--cook-bg)]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                        <h3 className="text-base font-bold text-white">Messages</h3>
                        <NavLink
                            to="/messenger"
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 transition-colors"
                        >
                            Stalk everyone <FiArrowRight size={12} />
                        </NavLink>
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto overscroll-contain py-1">
                        {conversations.length === 0 ? (
                            <div className="flex flex-col items-center py-10 gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">
                                    <FiMessageCircle size={24} className="text-gray-600" />
                                </div>
                                <p className="text-gray-500 text-sm">No conversations. Much popular.</p>
                                <NavLink
                                    to="/messenger"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-full transition-colors"
                                >
                                    Slide into DMs
                                </NavLink>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <NavLink
                                    key={conv.otherUserId}
                                    to={`/messenger/${conv.otherUserId}`}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-all duration-200"
                                >
                                    <div className="relative shrink-0">
                                        <OnlineAvatar
                                            userId={conv.otherUserId}
                                            avatarUrl={conv.otherAvatarUrl}
                                            username={conv.otherUsername}
                                            size="lg"
                                            className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
                                        />
                                        {conv.unreadCount > 0 && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-[#1a1a1a]" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>
                                                {conv.otherUsername}
                                            </span>
                                            <span className="text-[11px] text-gray-500 shrink-0">
                                                {formatTimeAgo(conv.lastMessageDate)}
                                            </span>
                                        </div>
                                        <p className={`text-[12px] truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </NavLink>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageUI;
