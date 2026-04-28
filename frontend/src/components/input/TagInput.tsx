import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { IoIosAdd } from "react-icons/io";

interface TagInputProps {
  onChange?: (tags: string[]) => void;
}

const TagInput = ({ onChange }: TagInputProps) => {

    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>("");
    const handleAddTag = () => {
        if (inputValue.trim() !== "" && tags.length < 5) {
            const updated = [...tags, inputValue.trim()];
            setTags(updated);
            onChange?.(updated);
            setInputValue("");
        }
    };

    const handleremoveTag = (index: number) => {
        const updated = tags.filter((_, i) => i !== index);
        setTags(updated);
        onChange?.(updated);
    }
    return (
        <div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mx-auto">
            <div className="flex flex-row items-end justify-between px-1">
                <div className="flex flex-col gap-0.5">
                    <p className="text-orange-500/80 text-xs font-bold tracking-widest">
                        Tags
                    </p>
                </div>
                <p className="text-gray-600 text-xs font-mono">
                    <span className={tags.length >= 5 ? "text-red-500" : "text-orange-500"}>
                        {tags.length}
                    </span>
                    /5
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 min-h-[42px] p-2 rounded-xl">
                {tags.length === 0 && (
                    <p className="text-gray-600 text-xs italic px-2">No tags added yet...</p>
                )}
                {tags.map((tag, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 
                           rounded-xl px-2 py-1 text-xs text-white/80 shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={() => handleremoveTag(index)}
                            className="cursor-pointer hover:text-red-500
                                rounded-full p-1 hover:bg-white/10 transition-colors"
                        >
                            <IoMdClose size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-4 w-full">
                    <input
                        type="text"
                        placeholder="Add a tag (e.g. Dessert)"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 bg-white/2 p-2 rounded-lg
                        placeholder:text-gray-600 text-sm text-white/90
                        border-2 border-white/10 focus:border-orange-500/40
                        outline-none transition-all"
                        disabled={tags.length >= 5}
                    />
                    <button
                        type="button"
                        onClick={handleAddTag}
                        disabled={tags.length >= 5}
                        className="cursor-pointer rounded-lg px-10
                        bg-orange-500/20 border border-orange-500/30
                        hover:bg-orange-500/40 text-orange-500 hover:text-white/70
                        disabled:opacity-20 disabled:cursor-not-allowed
                        transition-all flex items-center justify-center"
                    >
                        <IoIosAdd size={24} />
                    </button>
                </div>

                {tags.length >= 5 && (
                    <p className="text-red-400/80 text-[10px] px-1 italic">
                        Maximum 5 tags allowed
                    </p>
                )}
            </div>
        </div>
    );
}

export default TagInput;