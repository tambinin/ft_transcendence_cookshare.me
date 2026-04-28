export interface NotificationLineProps {
    username: string;
    userprofil: string;
    notification: string;
    title?: string;
}

const NotificationLine = ({ username, userprofil, notification, title }: NotificationLineProps) => {
    return (
        <div className="flex items-start gap-3 p-3 hover:bg-white/5 cursor-pointer transition-all duration-200 group border-b border-gray-800/50">
            <div className="relative shrink-0">
                <img
                    src={userprofil}
                    alt={username}
                    className="w-11 h-11 rounded-full object-cover border border-gray-700"
                />
            </div>
            <div className="flex flex-col grow min-w-0">
                <div className="text-sm leading-relaxed text-left text-gray-300">
                    <span className="font-bold text-white hover:text-orange-400 transition-colors">
                        {username}
                    </span>
                    <span className="mx-1">{notification}</span>
                    <span className="font-semibold text-orange-400/90 italic">
                        {title ? '"' + title + '"' : ""}
                    </span>
                </div>
            </div>
            <div className="self-center">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
        </div>
    );
}
export default NotificationLine;