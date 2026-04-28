import { useState, useCallback } from 'react';
import Fileselect from "../components/input/Fileselect";
import { FaPaperPlane } from "react-icons/fa6";
import logger from '../utils/logger';

interface ConversationFooterProps {
    onSendMessage: (content: string) => Promise<void>;
    onTyping: () => void;
}

const ConversationFooter = ({ onSendMessage, onTyping }: ConversationFooterProps) => {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = useCallback(async () => {
        const trimmed = content.trim();
        if (!trimmed || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(trimmed);
            setContent('');
        } catch (error) {
            logger.error('[ConversationFooter] Failed to send:', error);
        } finally {
            setIsSending(false);
        }
    }, [content, isSending, onSendMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);
        onTyping();
    }, [onTyping]);

    return (
        <div className="mt-auto border-t border-white/5 w-full px-4 md:px-6 py-3">
            <div className="flex gap-2 items-center">
                <Fileselect />
                <div className="flex-1">
                    {/* RESPONSIVE FIX: ensure input font-size >= 16px to prevent iOS zoom */}
                    <input
                        type="text"
                        placeholder="Écrivez un message..."
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disabled={isSending}
                        className="w-full h-11 px-4 rounded-xl bg-white/5
                            placeholder:text-gray-500 text-base text-white
                            focus:outline-none focus:ring-1 focus:ring-orange-400/50
                            border border-white/5 hover:border-white/10
                            disabled:opacity-50 transition-all"
                    />
                </div>
                {/* RESPONSIVE FIX: touch-friendly send button */}
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!content.trim() || isSending}
                    className={`flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px]
                        ${content.trim()
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-white/5 text-gray-600 cursor-not-allowed'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <FaPaperPlane size={16} />
                </button>
            </div>
        </div>
    );
}

export default ConversationFooter;
