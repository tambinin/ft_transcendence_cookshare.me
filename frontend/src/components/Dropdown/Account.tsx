import { useState, useEffect, useRef } from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineLogout, MdBlock } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { useAuth } from "@cookshare/hooks"
import { getAvatarUrl } from '../../utils/avatar.utils';
import OnlineAvatar from '../OnlineAvatar';
import Profile from '../Modal/ProfilModal';
import Deconnexion from '../Modal/DeconnexionModal';
import SettingsModal from '../Modal/Settings';
import socialService from '../../services/social.service';
import { IoClose } from 'react-icons/io5';

const Account = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showBlocked, setShowBlocked] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<{ id: string; username: string; avatarUrl: string | null }[]>([]);
    const [blockedLoading, setBlockedLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const profilRef = useRef<HTMLDialogElement>(null);
    const deconnexionRef = useRef<HTMLDialogElement>(null);
    const settingRef = useRef<HTMLDialogElement>(null);

    const profilePicture = getAvatarUrl(user?.avatarUrl);

    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowBlocked(false);
            }
        };
        document.addEventListener("mousedown", closeMenu);
        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);

    const handleShowBlocked = async () => {
        setShowBlocked(true);
        setBlockedLoading(true);
        try {
            const res = await socialService.getBlockedUsers();
            setBlockedUsers(Array.isArray(res.data) ? res.data : []);
        } catch {
            setBlockedUsers([]);
        } finally {
            setBlockedLoading(false);
        }
    };

    const handleUnblock = async (userId: string) => {
        try {
            await socialService.unblockUser(userId);
            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
			// Silent error
			console.error("Token verification failed:", error);
		}
    };

    return (
        <div className='relative' ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='rounded-full'
            >
                <img
                    className='rounded-full w-9 h-9 sm:w-11 sm:h-11 object-cover'
                    src={profilePicture}
                    alt="Profilee"
                    loading="lazy"
                />
            </button>
            {isOpen && (
                <div className="fixed right-2 top-16 sm:top-20 px-4 py-4 w-[calc(100vw-16px)] sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:w-[400px] md:w-[450px]
                    bg-[var(--cook-bg)]/95 backdrop-blur-xl
                    border border-white/10 rounded-2xl
                    shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50
                    overflow-hidden">
                    {!showBlocked ? (
                        <div className="grid grid-rows-1 gap-2">
                            <div
                                className="flex flex-row mx-2 mb-2 gap-8
                                    justify-start items-center"
                            >
                                <img className='rounded-full' src={profilePicture} width={40} height={40} alt="Profilee" loading="lazy" />
                                <p className='text-white/70 font-bold text-xl tracking-wider'>{user?.username || 'Username'}</p>
                            </div>
                            <button
                                className='text-white/70 text-center text-lg
                                hover:bg-white/10 rounded-lg
                                transition tracking-wider p-2 mx-2
                                flex flex-row items-center justify-start gap-8'
                                onClick={() => profilRef.current?.showModal()}
                            >
                                <CgProfile size={24} />
                                Profile
                            </button>
                            <button
                                className='text-white/70 text-center text-lg
                                hover:bg-white/10 rounded-lg
                                transition tracking-wider p-2 mx-2
                                flex flex-row items-center justify-start gap-8'
                                onClick={() => settingRef.current?.showModal()}
                            >
                                <IoSettingsOutline size={24} />
                                Settings
                            </button>
                            <button
                                className='text-white/70 text-center text-lg
                                hover:bg-white/10 rounded-lg
                                transition tracking-wider p-2 mx-2
                                flex flex-row items-center justify-start gap-8'
                                onClick={handleShowBlocked}
                            >
                                <MdBlock size={24} />
                                Blocked Users
                            </button>
                            <button
                                className='text-red-700 text-center text-lg
                                hover:bg-white/10 rounded-lg
                                transition tracking-wider p-2 mx-2
                                flex flex-row items-center justify-start gap-8'
                                onClick={() => deconnexionRef.current?.showModal()}
                            >
                                <MdOutlineLogout size={24} />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-white">Blocked Users</h3>
                                <button
                                    onClick={() => setShowBlocked(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>
                            <div className="h-px bg-white/[0.06] mb-2" />
                            <div className="max-h-[300px] overflow-y-auto overscroll-contain">
                                {blockedLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" />
                                    </div>
                                ) : blockedUsers.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 gap-2">
                                        <MdBlock size={32} className="text-gray-600" />
                                        <p className="text-gray-500 text-sm">No blocked users</p>
                                    </div>
                                ) : (
                                    blockedUsers.map(u => (
                                        <div key={u.id} className="flex items-center gap-3 px-2 py-2.5 hover:bg-white/[0.04] rounded-lg transition-colors">
                                            <OnlineAvatar
                                                userId={u.id}
                                                avatarUrl={u.avatarUrl}
                                                username={u.username}
                                                size="md"
                                                className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                                            />
                                            <span className="flex-1 text-sm font-medium text-white truncate">{u.username}</span>
                                            <button
                                                onClick={() => handleUnblock(u.id)}
                                                className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <Profile modelRef={profilRef} />
            <SettingsModal modalRef={settingRef} />
            <Deconnexion
                modelRef={deconnexionRef}
            />
        </div>
    );
}
export default Account
