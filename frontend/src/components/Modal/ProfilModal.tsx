import { useState } from "react";
import ChangePicture from "../ChangePicture";
import { FiEdit3 } from "react-icons/fi";
import { getAvatarUrl } from '../../utils/avatar.utils';
import { useAuth, useProfileUpdate } from "@cookshare/hooks";

interface ProfileModalProps {
	modelRef: React.RefObject<HTMLDialogElement | null>;
}

const ProfileModal = ({ modelRef }: ProfileModalProps) => {
	const { user } = useAuth();
	const { updateProfile, updateAvatar, isUpdating, updateError, clearError } = useProfileUpdate();
	const [user_name, setUsername] = useState(user?.username || "");
	const [user_lastname, setLastname] = useState(user?.lastName || "");
	const [user_firstname, setFirstname] = useState(user?.firstName || "");
	const [user_email, setEmail] = useState(user?.email || "");
	const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
	const profilePictureURL : string = getAvatarUrl(user?.avatarUrl);
	const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

	const handleAvatarSelect = (file: File) => {
		setSelectedAvatarFile(file);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();		
		if (!user_name.trim()) {
			setToast({ type: 'error', message: 'Username is required.' });
			setTimeout(() => setToast(null), 4000);
			return;
		}
		
		clearError();
		if (selectedAvatarFile) {
			await updateAvatar(selectedAvatarFile);
			setSelectedAvatarFile(null);
		}
		await updateProfile({
			username: user_name.trim(),
			lastName: user_lastname?.trim(),
			firstName: user_firstname?.trim(),
			email: user_email?.trim()
		});
		if (updateError) {
			setToast({ type: 'error', message: updateError });
			setTimeout(() => setToast(null), 5000);
		} else {
			setToast({ type: 'success', message: 'Profile updated.' });
			setTimeout(() => setToast(null), 2500);
			modelRef.current?.close();
		}
	}

    return (
        <dialog ref={modelRef}
            className="modal shadow-2xl
                backdrop:bg-black/50 backdrop-blur-sm
                "
        >
            <div
                className="modal-box bg-[var(--cook-bg)] rounded-2xl"
            >
                <p className="text-2xl font-bold
                    text-orange-200 text-center mb-4"
                >
                    Profile
                </p>
				{toast && (
					<div className="toast toast-top toast-end z-[9999]">
						<div className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'} shadow-lg`}>
							<span className="text-sm">{toast.message}</span>
							<button type="button" onClick={() => setToast(null)} className="btn btn-ghost btn-xs">✕</button>
						</div>
					</div>
				)}
                <form onSubmit={handleSave} className="flex flex-col gap-4 m-2">
                    <div className="flex items-center justify-center relative">
                        <ChangePicture 
                            pictureDefaultURL={getAvatarUrl(profilePictureURL)} 
                            onFileSelect={handleAvatarSelect}
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative w-fit">
                            <input
                                type="text"
                                value={user_name} maxLength={20}
                                className="text-center text-lg text-white/70
                                focus:outline-none outline-none border-b
                                border-white/10 w-[24ch]"
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <FiEdit3 size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="lastname" className="text-xs text-left text-white/70 p-1">Last name</label>
                            <input
                                type="text"
                                value={user_lastname}
                                id="lastname"
                                className="text-left text-lg text-white/70 
                                pl-2 p-2 rounded-lg border-2 border-white/10 bg-transparent
                                focus:outline-none focus:border-orange-500 transition-colors w-full"
                                onChange={(e) => setLastname(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="firstname" className="text-xs text-left text-white/70 p-1">First name</label>
                            <input
                                type="text"
                                value={user_firstname}
                                id="firstname"
                                className="text-left text-lg text-white/70 
                                pl-2 p-2 rounded-lg border-2 border-white/10 bg-transparent
                                focus:outline-none focus:border-orange-500 transition-colors w-full"
                                onChange={(e) => setFirstname(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col col-span-2">
                            <label htmlFor="email" className="text-xs text-left text-white/70 p-1">Email</label>
                            <input
                                type="email"
                                value={user_email}
                                id="email"
                                className="text-left text-lg text-white/70 
                                pl-2 p-2 rounded-lg border-2 border-white/10 bg-transparent
                                focus:outline-none focus:border-orange-500 transition-colors w-full"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-6">
                        <button type="button"
                            onClick={() => modelRef.current?.close()}
                            aria-label="Close modal"
                            className="font-semibold p-2 w-[10ch]
                            bg-white/10 hover:bg-white/20
                            rounded-xl text-white/70"
                        >
                            CANCEL
                        </button>
                        <button type="submit"
                            disabled={isUpdating}
                            className="font-semibold p-2 w-[10ch]
                            bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50
                            rounded-xl text-white/70"
                        >
                            {isUpdating ? <span className="loading loading-dots loading-sm"></span> : 'SAVE'}
                        </button>
                    </div>
                </form>
            </div >
        </dialog >
    );
}

export default ProfileModal
