import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdNotificationsOutline } from "react-icons/io";
import { FiCheck, FiTrash2, FiBell } from "react-icons/fi";
import { useNotificationContext } from '../../contexts/notification.context';
import { useAuth } from '../../contexts/auth.context';
import { useRecipeModal } from '../../contexts/recipe.context';
import OnlineAvatar from '../OnlineAvatar';
import type { Notification } from '../../types/notification.type';

const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

/**
 * Normalize backend notification types to frontend display types.
 * Backend uses NEW_FRIEND_REQUEST / RECIPE_FAVORITED,
 * frontend uses FRIEND_REQUEST / RECIPE_LIKED for display.
 */
const normalizeType = (type: string): string => {
    switch (type) {
        case 'NEW_FRIEND_REQUEST': return 'FRIEND_REQUEST';
        case 'RECIPE_FAVORITED': return 'RECIPE_LIKED';
        default: return type;
    }
};

const getNotificationMessage = (notification: Notification): { action: string; title?: string } => {
    const type = normalizeType(notification.type);
    switch (type) {
        case 'NEW_FOLLOWER':
            return { action: "started following you" };
        case 'FRIEND_REQUEST':
            return { action: "sent you a friend request" };
        case 'FRIEND_REQUEST_ACCEPTED':
            return { action: "accepted your friend request" };
        case 'NEW_MESSAGE':
            return { action: "sent you a message" };
        case 'NEW_COMMENT':
            return { action: "commented on your recipe", title: notification.data?.recipeTitle as string };
        case 'NEW_RATING':
            return { action: "rated your recipe", title: notification.data?.recipeTitle as string };
        case 'RECIPE_LIKED':
            return { action: "liked your recipe", title: notification.data?.recipeTitle as string };
        case 'NEW_RECIPE':
            return { action: "published a new recipe", title: notification.data?.recipeTitle as string };
        default:
            return { action: notification.message };
    }
};

/**
 * Returns badge info for a notification type.
 */
const getNotificationBadge = (notification: Notification): { label: string; colorClass: string } => {
    const type = normalizeType(notification.type);
    switch (type) {
        case 'NEW_FOLLOWER': return { label: 'Follow', colorClass: 'bg-white/5 text-gray-500' };
        case 'FRIEND_REQUEST': return { label: 'Request', colorClass: 'bg-blue-500/10 text-blue-400' };
        case 'FRIEND_REQUEST_ACCEPTED': return { label: 'Accepted', colorClass: 'bg-blue-500/10 text-blue-400' };
        case 'NEW_MESSAGE': return { label: 'Message', colorClass: 'bg-green-500/10 text-green-400' };
        case 'NEW_COMMENT': return { label: 'Comment', colorClass: 'bg-purple-500/10 text-purple-400' };
        case 'NEW_RATING': return { label: 'Rating', colorClass: 'bg-yellow-500/10 text-yellow-400' };
        case 'RECIPE_LIKED': return { label: 'Like', colorClass: 'bg-red-500/10 text-red-400' };
        case 'NEW_RECIPE': return { label: 'Recipe', colorClass: 'bg-orange-500/10 text-orange-400' };
        default: return { label: 'System', colorClass: 'bg-white/5 text-gray-500' };
    }
};

const NotificationItem = ({
    notification,
    onMarkRead,
    onDelete,
    onNavigate,
    onOpenRecipe,
}: {
    notification: Notification;
    onMarkRead: (id: string) => void;
    onDelete: (id: string) => void;
    onNavigate: (path: string) => void;
    onOpenRecipe: (recipeId: string) => void;
}) => {
    const { action, title } = getNotificationMessage(notification);
    const avatarUrl = notification.data?.avatarUrl as string || null;
    const username = notification.data?.username as string || notification.title;
    const senderId = notification.data?.userId as string || notification.data?.senderId as string || '';
    const recipeId = notification.data?.recipeId as string || '';
    const type = normalizeType(notification.type);
    const badge = getNotificationBadge(notification);

    /**
     * Determine what happens on click:
     * - Recipe-related (comment, rating, like, new_recipe) → open recipe modal
     * - Profile-related (follower, friend request) → navigate to profile
     * - Message → navigate to messenger
     */
    const handleClick = () => {
        if (!notification.isRead) {
            onMarkRead(notification.id);
        }

        switch (type) {
            case 'NEW_COMMENT':
            case 'NEW_RATING':
            case 'RECIPE_LIKED':
            case 'NEW_RECIPE':
                if (recipeId) {
                    onOpenRecipe(recipeId);
                }
                break;
            case 'NEW_FOLLOWER':
            case 'FRIEND_REQUEST':
            case 'FRIEND_REQUEST_ACCEPTED':
                if (senderId) onNavigate(`/profile/${senderId}`);
                break;
            case 'NEW_MESSAGE':
                if (senderId) onNavigate(`/messenger/${senderId}`);
                break;
            default:
                break;
        }
    };

    const isClickable = (() => {
        switch (type) {
            case 'NEW_COMMENT':
            case 'NEW_RATING':
            case 'RECIPE_LIKED':
            case 'NEW_RECIPE':
                return !!recipeId;
            case 'NEW_FOLLOWER':
            case 'FRIEND_REQUEST':
            case 'FRIEND_REQUEST_ACCEPTED':
            case 'NEW_MESSAGE':
                return !!senderId;
            default:
                return false;
        }
    })();

    return (
        <div
            onClick={handleClick}
            role={isClickable ? 'link' : undefined}
            className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.06] transition-all duration-200 group
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                ${!notification.isRead ? 'bg-orange-500/[0.04] border-l-2 border-l-orange-500/60' : 'border-l-2 border-l-transparent'}`}
        >
            {/* Avatar — clicking it navigates to user profile */}
            <div
                className="relative shrink-0 cursor-pointer"
                onClick={(e) => {
                    if (senderId) {
                        e.stopPropagation();
                        if (!notification.isRead) onMarkRead(notification.id);
                        onNavigate(`/profile/${senderId}`);
                    }
                }}
            >
                <OnlineAvatar
                    userId={senderId}
                    avatarUrl={avatarUrl}
                    username={username}
                    size="md"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-orange-500/30 transition-all"
                    hideDot={!senderId}
                />
                {!notification.isRead && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col grow min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span
                        className="font-semibold text-white text-[13px] truncate hover:text-orange-400 transition-colors cursor-pointer"
                        onClick={(e) => {
                            if (senderId) {
                                e.stopPropagation();
                                if (!notification.isRead) onMarkRead(notification.id);
                                onNavigate(`/profile/${senderId}`);
                            }
                        }}
                    >
                        {username}
                    </span>
                    <span className={`text-[11px] shrink-0 ${!notification.isRead ? 'text-orange-400 font-medium' : 'text-gray-600'}`}>
                        {formatTimeAgo(notification.createdAt)}
                    </span>
                </div>
                <p className="text-[12px] text-gray-400 text-left mt-0.5 leading-snug">
                    {action}
                    {title && (
                        <span className="text-orange-400/80 font-medium"> « {title} »</span>
                    )}
                </p>
                {/* Notification type badge */}
                <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.colorClass}`}>
                        {badge.label}
                    </span>
                </div>
            </div>

            {/* Action buttons */}
            <div className="self-center flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!notification.isRead && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                        className="p-1.5 rounded-lg hover:bg-green-500/15 text-gray-500 hover:text-green-400 transition-colors"
                        title="Mark as read"
                    >
                        <FiCheck size={14} />
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete"
                >
                    <FiTrash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const NotificationUI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { openRecipeModal } = useRecipeModal();
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotificationContext();

    const handleNavigate = useCallback((path: string) => {
        setIsOpen(false);
        navigate(path);
    }, [navigate]);

    const handleOpenRecipe = useCallback((recipeId: string) => {
        setIsOpen(false);
        openRecipeModal(recipeId);
    }, [openRecipeModal]);

    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", closeMenu);
        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full transition-all ${isOpen ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 bg-white/5 hover:bg-white/10'}`}
            >
                <IoMdNotificationsOutline size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed right-2 top-16 sm:top-20 px-4 w-[calc(100vw-16px)] sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:w-[400px] md:w-[450px] bg-[var(--cook-bg)]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                                >
                                    Read all
                                </button>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">{unreadCount} unread</p>
                        )}
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                        {isLoading ? (
                            <div className="flex flex-col items-center py-10 gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" />
                                <p className="text-gray-500 text-xs">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center py-10 gap-2">
                                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">
                                    <FiBell size={24} className="text-gray-600" />
                                </div>
                                <p className="text-gray-500 text-sm">No notifications. Nobody loves you.</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkRead={markAsRead}
                                    onDelete={deleteNotification}
                                    onNavigate={handleNavigate}
                                    onOpenRecipe={handleOpenRecipe}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationUI;
