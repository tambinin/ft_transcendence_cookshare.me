import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReturnBtn from '../components/UI/returnBtn';
import FindBar from '../components/UI/FindBar';
import { IoIosCreate } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";
import { IoChatbubblesOutline } from "react-icons/io5";
import UserMessage from '../components/UserMessage';
import ProfilMessageUI from '../components/UI/ProfilMessageUI';
import MessageOption from '../components/UI/MessageOption';
import Conversation from './Conversation';
import { useChatContext } from '../contexts/chat.context';
import userService from '../services/user.service';
import socialService from '../services/social.service';
import logger from '../utils/logger';
import type { User } from '../types/user.type';
import { getAvatarUrl } from '../utils/avatar.utils';
import { useAuth } from '../contexts/auth.context';
import { useFeedRefresh } from '../contexts/feed.context';
import OnlineAvatar from '../components/OnlineAvatar';

const Messenger = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { isUserOnline } = useFeedRefresh();
    const {
        conversations,
        setActiveConversationUserId,
        markConversationAsRead,
        loadConversations,
        clearBadge,
    } = useChatContext();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [, setIsLoadingUser] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const markedReadRef = useRef<string | null>(null);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [newMsgQuery, setNewMsgQuery] = useState('');
    const [newMsgResults, setNewMsgResults] = useState<{ id: string; username: string; avatarUrl: string | null }[]>([]);
    const [newMsgLoading, setNewMsgLoading] = useState(false);
    const newMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const query = searchQuery.toLowerCase().trim();
        return conversations.filter(conv =>
            conv.otherUsername.toLowerCase().includes(query) ||
            conv.lastMessage.toLowerCase().includes(query)
        );
    }, [conversations, searchQuery]);

    useEffect(() => {
        setActiveConversationUserId(userId || null);
        markedReadRef.current = null;
        return () => {
            setActiveConversationUserId(null);
        };
    }, [userId, setActiveConversationUserId]);

    useEffect(() => {
        if (!userId) return;
        if (markedReadRef.current === userId) return;
        const conv = conversations.find(c => c.otherUserId === userId);
        if (conv && conv.unreadCount > 0) {
            markedReadRef.current = userId;
            markConversationAsRead(userId, conv.conversationId);
        }
    }, [userId, conversations, markConversationAsRead]);

    useEffect(() => {
        loadConversations();
        clearBadge();
    }, [loadConversations, clearBadge]);

    useEffect(() => {
        if (!newMsgQuery.trim()) {
            setNewMsgResults([]);
            return;
        }
        if (newMsgTimerRef.current) clearTimeout(newMsgTimerRef.current);
        newMsgTimerRef.current = setTimeout(async () => {
            setNewMsgLoading(true);
            try {
                const res = await socialService.searchUsers(newMsgQuery.trim(), 8);
                setNewMsgResults(res.data ?? []);
            } catch {
                setNewMsgResults([]);
            } finally {
                setNewMsgLoading(false);
            }
        }, 300);
        return () => { if (newMsgTimerRef.current) clearTimeout(newMsgTimerRef.current); };
    }, [newMsgQuery]);

    const handleNewMessageSelect = (userId: string) => {
        setShowNewMessage(false);
        setNewMsgQuery('');
        setNewMsgResults([]);
        navigate(`/messenger/${userId}`);
    };

    useEffect(() => {
        if (!userId || !isAuthenticated) {
            setSelectedUser(null);
            return;
        }
        const loadUser = async () => {
            setIsLoadingUser(true);
            try {
                const response = await userService.getUserById(userId);
                setSelectedUser(response.data);
            } catch (error) {
                logger.error('[Messenger] Failed to load user:', error);
                setSelectedUser(null);
            } finally {
                setIsLoadingUser(false);
            }
        };
        loadUser();
    }, [userId, isAuthenticated]);

    const handleSelectConversation = useCallback((otherUserId: string) => {
        navigate(`/messenger/${otherUserId}`);
    }, [navigate]);

    const handleBack = useCallback(() => {
        setShowProfile(false);
        navigate('/messenger', { replace: true });
    }, [navigate]);
    const hasActiveConversation = !!userId;
    const hasFullConversation = userId && selectedUser;
    const onlineCount = conversations.filter(c => isUserOnline(c.otherUserId)).length;
    return (
        <div className="h-screen flex flex-col bg-[#0d1117]">
            <nav className="flex items-center gap-3 shrink-0 py-3 px-4 md:py-4 md:px-6
                min-h-[56px] md:min-h-[64px] bg-[#0d1117]/80 backdrop-blur-md
                border-b border-white/5 shadow-[0_4px_24px_0_rgba(0,0,0,0.3)] z-10">
                {hasActiveConversation ? (
                    <button onClick={handleBack} className="md:hidden text-gray-400 hover:text-white p-1 transition-colors">
                        <IoArrowBack size={22} />
                    </button>
                ) : null}
                <div className="hidden md:block">
                    <ReturnBtn />
                </div>
                {!hasActiveConversation && (
                    <div className="md:hidden">
                        <ReturnBtn />
                    </div>
                )}
                <div className="flex items-center justify-center w-full gap-2">
                    <IoChatbubblesOutline className="text-orange-400" size={24} />
                    <p className="font-semibold text-xl md:text-2xl text-white">Messenger</p>
                </div>
            </nav>
            <main className="flex-1 flex overflow-hidden">
                <aside className={`
                    flex flex-col bg-[#0d1117] overflow-hidden
                    w-full md:w-80 lg:w-96 md:shrink-0 md:border-r md:border-white/5
                    ${hasActiveConversation ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="px-4 pt-4 pb-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-xl text-white">Messages</p>
                                {onlineCount > 0 && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {onlineCount} online
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowNewMessage(!showNewMessage)}
                                className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer
                                    ${showNewMessage
                                        ? 'bg-orange-500/20 text-orange-400'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <IoIosCreate size={20} />
                            </button>
                        </div>

                        <FindBar
                            key={showNewMessage ? 'new-msg' : 'search'}
                            onChange={(val) => {
                                if (showNewMessage) {
                                    setNewMsgQuery(val);
                                    setSearchQuery('');
                                } else {
                                    setSearchQuery(val);
                                    setNewMsgQuery('');
                                }
                            }}
                            placeholder={showNewMessage ? "Search for a user..." : "Search conversations..."}
                        />
                        {showNewMessage && (newMsgResults.length > 0 || newMsgLoading) && (
                            <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                                {newMsgLoading && (
                                    <div className="flex justify-center py-3">
                                        <span className="loading loading-spinner loading-sm text-orange-400" />
                                    </div>
                                )}
                                {newMsgResults.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleNewMessageSelect(u.id)}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/5 transition-colors"
                                    >
                                        <OnlineAvatar userId={u.id} avatarUrl={u.avatarUrl} username={u.username} size="sm" className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
                                        <span className="text-sm text-white font-medium">{u.username}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <IoChatbubblesOutline className="text-gray-600" size={28} />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">
                                    {searchQuery.trim() ? 'No results' : 'No conversations'}
                                </p>
                                <p className="text-gray-600 text-xs mt-1">
                                    {searchQuery.trim()
                                        ? 'Search harder, genius.'
                                        : "Start a conversation. Don't be shy."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredConversations.map((conv) => (
                                    <UserMessage
                                        key={conv.otherUserId}
                                        userId={conv.otherUserId}
                                        picture={conv.otherAvatarUrl}
                                        name={conv.otherUsername}
                                        message={conv.lastMessage}
                                        date={conv.lastMessageDate}
                                        unreadCount={conv.unreadCount}
                                        isOnline={isUserOnline(conv.otherUserId)}
                                        isActive={userId === conv.otherUserId}
                                        onClick={() => handleSelectConversation(conv.otherUserId)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
                <section className={`
                    flex-1 bg-[#0d1117] min-w-0
                    ${hasActiveConversation ? 'flex flex-col' : 'hidden md:flex md:flex-col'}
                `}>
                    {hasFullConversation ? (
                        <Conversation
                            otherUserId={userId}
                            otherUser={selectedUser}
                        />
                    ) : hasActiveConversation ? (
                        <div className="flex items-center justify-center h-full">
                            <span className="loading loading-spinner loading-lg text-orange-400"></span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center px-6">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/10 to-orange-600/5
                                    flex items-center justify-center mx-auto mb-6 border border-orange-500/10">
                                    <IoChatbubblesOutline className="text-orange-400/60" size={40} />
                                </div>
                                <p className="text-lg font-semibold text-white mb-2">Your DMs</p>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                                    Select a conversation or start a new one to pretend you have friends.
                                </p>
                                <button
                                    onClick={() => setShowNewMessage(true)}
                                    className="mt-6 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm
                                        font-medium rounded-xl transition-colors cursor-pointer"
                                >
                                    Shoot a text
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {hasFullConversation && (
                    <>
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="lg:hidden fixed bottom-4 right-4 z-20 bg-orange-500 text-white
                                p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors
                                hidden md:block"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button>
                        <aside className={`
                            bg-[#0d1117] border-l border-white/5 overflow-y-auto shrink-0
                            lg:w-72 xl:w-80 lg:block
                            ${showProfile
                                ? 'fixed inset-0 z-30 lg:relative lg:inset-auto'
                                : 'hidden lg:block'
                            }
                        `}>
                            {showProfile && (
                                <button
                                    onClick={() => setShowProfile(false)}
                                    className="lg:hidden m-4 text-gray-400 hover:text-white transition-colors"
                                >
                                    <IoArrowBack size={22} />
                                </button>
                            )}
                            <ProfilMessageUI user={{
                                id: selectedUser.id,
                                picture: getAvatarUrl(selectedUser.avatarUrl),
                                name: selectedUser.username
                            }} />
                            <MessageOption />
                        </aside>
                    </>
                )}
            </main>
        </div>
    );
}

export default Messenger
