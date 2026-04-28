import React from 'react';
import Sender from "../components/UI/Sender";
import Recever from "../components/UI/recever";
import type { Message } from '../types/chat.type';

interface ConversationBodyProps {
    messages: Message[];
    isLoading: boolean;
    currentUserId: string;
    otherUserAvatar: string;
    otherUsername: string;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const ConversationBody = ({
    messages,
    isLoading,
    currentUserId,
    otherUserAvatar,
    otherUsername,
    messagesEndRef,
}: ConversationBodyProps) => {
    return (
        <div className="flex-1 px-4 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <span className="loading loading-spinner loading-md text-orange-400" />
                </div>
            )}

            {!isLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-500 text-sm">
                        Cricket noises... Send a message to break the ice.
                    </p>
                </div>
            )}

            {messages.map((msg) => {
                const isSender = msg.senderId === currentUserId;
                const time = formatTime(msg.createdAt);

                return isSender ? (
                    <Sender
                        key={msg.id}
                        message={msg.content}
                        time={time}
                    />
                ) : (
                    <Recever
                        key={msg.id}
                        picture={otherUserAvatar}
                        message={msg.content}
                        time={time}
                        sender={otherUsername}
                    />
                );
            })}

            <div ref={messagesEndRef} />
        </div>
    );
}

export default ConversationBody;
