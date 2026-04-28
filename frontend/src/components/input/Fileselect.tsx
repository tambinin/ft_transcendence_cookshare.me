import { useState } from "react";
import { ImAttachment } from "react-icons/im";
import { useRef } from "react";

const Fileselect = () => {
    const [, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
        }
    }

    return (
        <div className="flex items-center justify-center p-4 rounded-full hover:bg-[var(--cook-bg-surface)] cursor-pointer">
            <button onClick={handleButtonClick}>
                <ImAttachment size={24} />
            </button>
            <input type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}

export default Fileselect;
