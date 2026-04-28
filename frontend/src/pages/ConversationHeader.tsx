import { FaVideo } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import OnlineAvatar from '../components/OnlineAvatar';

interface ConversationHeaderProps {
    user: {
        id: string;
        picture: string;
        name: string;
    }
    status: boolean;
    isTyping?: boolean;
}

const ConversationHeader = ({ user, status, isTyping }: ConversationHeaderProps) => {
    return (
        <div className="h-16 w-full border-b border-white/5 px-4 md:px-6 flex items-center
            bg-[#0d1117]/60 backdrop-blur-sm">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                    <OnlineAvatar
                        userId={user.id}
                        avatarUrl={user.picture}
                        username={user.name}
                        isOnline={status}
                        size="md"
                        className="w-10 h-10 rounded-full ring-1 ring-white/10 object-cover"
                        dotBorderClass="border-[#0d1117]"
                    />
                    <div className="flex flex-col text-left">
                        <p className="font-semibold text-sm text-white leading-tight">{user.name}</p>
                        {isTyping ? (
                            <p className="text-xs text-orange-400 italic animate-pulse">is typing...</p>
                        ) : (
                            <p className={`text-xs ${status ? 'text-green-400' : 'text-gray-500'}`}>
                                {status ? "Online" : "Touching grass"}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        type="button"
                        className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                    >
                        <IoCall size={18} />
                    </button>
                    <button
                        type="button"
                        className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                    >
                        <FaVideo size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConversationHeader;
