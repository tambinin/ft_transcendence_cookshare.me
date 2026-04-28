import OnlineAvatar from './OnlineAvatar';

interface UserMessageProps {
    userId: string;
    picture: string | null;
    name: string;
    message: string;
    date: string;
    unreadCount: number;
    isOnline: boolean;
    isActive: boolean;
    onClick: () => void;
}

const UserMessage = ({ userId, picture, name, message, date, unreadCount, isOnline, isActive, onClick }: UserMessageProps) => {
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

    return (
        <div
            className={`group cursor-pointer px-3 py-3 rounded-xl transition-all duration-150
                ${isActive
                    ? 'bg-orange-500/10 border border-orange-500/20'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                <OnlineAvatar
                    userId={userId}
                    avatarUrl={picture}
                    username={name}
                    isOnline={isOnline}
                    size="lg"
                    className={`w-12 h-12 rounded-full object-cover ring-1
                        ${isActive ? 'ring-orange-400/40' : 'ring-white/10'}`}
                    dotBorderClass="border-[#0d1117]"
                />

                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <p className={`text-sm font-semibold truncate
                            ${isActive ? 'text-orange-300' : 'text-gray-200'}`}>
                            {name}
                        </p>
                        <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">{formattedDate}</span>
                    </div>
                    <p className={`text-left text-xs truncate mt-0.5
                        ${unreadCount > 0 ? 'font-medium text-gray-300' : 'text-gray-500'}`}>
                        {message.length > 35 ? message.substring(0, 35) + "..." : message}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <div className="flex items-center justify-center min-w-[22px] h-[22px]
                        bg-orange-500 rounded-full px-1.5 flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserMessage
