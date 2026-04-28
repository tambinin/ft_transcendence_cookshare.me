import { NavLink } from "react-router-dom";

interface MessageLineProps {
    username: string;
    userprofil: string;
    message: string;
}

const MessageLine = ({ username, userprofil, message }: MessageLineProps) => {
    return (
        <NavLink to={"/messenger"} className='relative flex flex-row gap-2 py-2 px-2 hover:bg-[var(--cook-bg-surface)] rounded-lg cursor-pointer transition-all duration-200 group'>
            <div className='flex items-center'>
                <img
                    className='w-12 h-12 rounded-full object-cover flex-shrink-0'
                    src={userprofil}
                    alt={username}
                />
            </div>
            <div className='flex flex-col gap-1 max-w-[80%]'>
                <div className='px-1.5 py-1.5 rounded-2xl'>
                    <div className='flex flex-row justify-between w-full items-center px-1'>
                        <p className='text-xs font-bold text-[var(--cook-text)] mb-0.5 hover:underline cursor-pointer'>
                            {username}
                        </p>
                    </div>
                    <p className='text-sm text-[#b0b3b8] text-left leading-tight px-0.5'>
                        {message.length > 50 ? message.slice(0, 50) + '...' : message}
                    </p>
                </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
            </div>
        </NavLink>
    );
}

export default MessageLine;