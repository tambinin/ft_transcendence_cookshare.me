import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { TbCameraUp } from "react-icons/tb";
import { getAvatarUrl } from '../utils/avatar.utils';

interface ChangePictureProps {
    pictureDefaultURL?: string;
    onFileSelect?: (file: File) => void;
}

const ChangePicture = ({ pictureDefaultURL, onFileSelect }: ChangePictureProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profilePicture, setProfilePicture] = useState<string>(getAvatarUrl(pictureDefaultURL));
    const [error, setError] = useState<string | null>(null);
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    }
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
            onFileSelect?.(file);
        }
        else {
            setError("File is not an image");
            setTimeout(() => setError(null), 5000);
        }
    }
    return (
        <>
        {error && (
            <div role="alert" className="alert alert-error absolute right-0 z-50 w-80 max-w-[90vw]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 wrap-break-word text-sm">{error}</span>
            </div>
        )}
        <div className="relative">
            <img
                src={profilePicture}
                alt=""
                className="w-32 h-32 rounded-full
                border-2 border-orange-200"
            />
            <button type="button" onClick={handleButtonClick} className="absolute bottom-0.5 right-0.25 bg-gray-800 rounded-full p-1">
                <TbCameraUp size={32} className="rounded-2xl text-orange-400" />
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-500 file:text-white
                hover:file:bg-orange-600
                cursor-pointer hidden"
                onChange={handleFileChange}
            />
        </div>
        </>
    )
}

export default ChangePicture;
