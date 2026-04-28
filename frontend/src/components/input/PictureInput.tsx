import { useState } from "react";
import { RiImageAddLine } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
import { useRef } from "react";

interface PictureInputProps {
  onFileChange: (file: File | null) => void;
}

const PictureInput = ({onFileChange}: PictureInputProps) => {
  const [preview, setPreview] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    }

  	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  	  const file = e.target.files?.[0] ?? null;
  	  onFileChange(file);

  	  if (file) {
  	    const reader = new FileReader();
  	    reader.onload = () => setPreview(reader.result as string);
  	    reader.readAsDataURL(file);
  	  }
  	};

  	const handleRemove = () => {
  	  setPreview("");
  	  onFileChange(null);
  	  if (fileInputRef.current) fileInputRef.current.value = "";
  	};

    return (
        <div className="flex items-center justify-center
                border-2 border-white/10
                rounded-xl text-white/40
                w-full max-w-[650px] min-h-[100px]
                border-dashed p-0.5
                relative overflow-hidden bg-white/5
                max-h-[600px] overflow-y-auto"
        >
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {!preview ? (
                <button
                    type="button"
                    onClick={handleButtonClick}
                    className="cursor-pointer flex flex-col items-center gap-2 hover:text-white transition-colors"
                >
                    <RiImageAddLine size={32} />
                    <span className="text-sm">Add a photo</span>
                </button>
            ) : (
                <>
                    <img
                        src={preview}
                        className="w-full h-auto rounded-lg block"
                        alt="Preview"
                    />

                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 z-10 p-1.5
                                 bg-black/50 text-white hover:bg-red-600 
                                 rounded-full transition-all shadow-lg"
                    >
                        <IoMdClose size={18} />
                    </button>
                </>
            )}
        </div >
    );
}

export default PictureInput;