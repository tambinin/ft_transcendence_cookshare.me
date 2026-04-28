import ConversationHeader from "./ConversationHeader";
import ConversationBody from "./ConversationBody";
import ConversationFooter from "./ConversationFooter";
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/auth.context';
import { getAvatarUrl } from '../utils/avatar.utils';
import { useChatContext } from '../contexts/chat.context';
import { useFeedRefresh } from '../contexts/feed.context';
import { useCallback } from 'react';
import type { User } from '../types/user.type';

interface ConversationProps {
    otherUserId: string;
    otherUser: User;
}

const Conversation = ({ otherUserId, otherUser }: ConversationProps) => {
    const { user } = useAuth();
    const { isUserOnline } = useFeedRefresh();
    const { updateConversationPreview, loadConversations, conversations } = useChatContext();
    const {
        messages,
        isLoading,
        isTyping,
        sendMessage,
        handleTyping,
        messagesEndRef,
    } = useChat(otherUserId);

    const handleSendMessage = useCallback(async (content: string) => {
        await sendMessage(content);
        const convExists = conversations.some(c => c.otherUserId === otherUserId);
        if (convExists) {
            updateConversationPreview(otherUserId, content.trim(), new Date().toISOString());
        } else {
            await loadConversations();
        }
    }, [sendMessage, updateConversationPreview, loadConversations, conversations, otherUserId]);

    return (
        <div className="flex flex-col h-full">
            <ConversationHeader
                user={{
                    id: otherUserId,
                    picture: getAvatarUrl(otherUser.avatarUrl),
                    name: otherUser.username,
                }}
                status={isUserOnline(otherUserId)}
                isTyping={isTyping}
            />
            <ConversationBody
                messages={messages}
                isLoading={isLoading}
                currentUserId={user?.id || ''}
                otherUserAvatar={getAvatarUrl(otherUser.avatarUrl)}
                otherUsername={otherUser.username}
                messagesEndRef={messagesEndRef}
            />
            <ConversationFooter
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
            />
        </div>
    );
}

export default Conversation;