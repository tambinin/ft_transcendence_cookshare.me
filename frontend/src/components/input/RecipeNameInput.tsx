import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

interface RecipeNameInputProps {
  onNameChange: (name: string) => void;
  onCookTimeChange: (time: number) => void;
  onDifficultyChange: (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => void;
}

const DIFFICULTY_MAP: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
  Easy: 'EASY',
  Medium: 'MEDIUM',
  Hard: 'HARD',
};

const RecipeNameInput = ({onNameChange, onCookTimeChange, onDifficultyChange} : RecipeNameInputProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState("Easy");
    const options = ["Easy", "Medium", "Hard"];
    return (
        <div
            className="flex flex-col sm:flex-row gap-4 py-2 w-full max-w-[516px] mx-auto"
        >
            <div className="flex flex-col gap-1 items-start w-full justify-center">
                <label htmlFor="name"
                    className="text-white/40 text-xs"
                >
                    Name
                </label>
                <input type="text" name="name" id="name"
                    placeholder="Enter recipe name"
					onChange={(e) => onNameChange(e.target.value)}
                    className="bg-white/2 border-2 w-full
                        placeholder:text-gray-600 text-sm
                        p-2 rounded-lg text-white/70
                        outline-none hover:border-white/20
                        border-white/20 focus:border-orange-500/50
                        focus:ring-1 focus:ring-orange-500/20"
                />
            </div>
            <div className="flex flex-row gap-4">
                <div className="flex flex-col gap-1 items-start justify-center flex-1 sm:flex-initial">
                    <label htmlFor="time"
                        className="text-white/40 text-xs"
                    >
                        Time
                    </label>
                    <input type="number" name="time" id="time"
                        min={0}
                        placeholder="Time to cook"
                        className="bg-white/2 border-2
                        placeholder:text-gray-600 text-sm
                        p-2 rounded-lg text-white/70 w-full sm:w-[15ch]
                        outline-none hover:border-white/20
                        border-white/20 focus:border-orange-500/50
                        focus:ring-1 focus:ring-orange-500/20"
                        onChange={(e) => onCookTimeChange(Number(e.target.value))}
                    />
                </div>
                <div className="flex flex-col gap-1 items-start justify-center text-white/70 text-sm flex-1 sm:flex-initial">
                    <p
                        className="text-white/40 text-xs"
                    >
                        Difficulty
                    </p>
                    <div className="relative w-full sm:w-[15ch] bg-white/2 text-white/70">
                        <div
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center justify-between
                                w-full sm:w-[15ch] h-[40px] p-2
                                outline-none hover:border-white/20
                                border-2 border-white/10 rounded-lg
                                cursor-pointer focus:border-orange-500/50
                                focus:ring-1 focus:ring-orange-500/20"
                        >
                            {selected}
                            <IoIosArrowDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isOpen && (
                            <ul className="absolute z-10 w-full mt-2 bg-[var(--cook-bg)] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                {options.map((option) => (
                                    <li
                                        key={option}
                                        onClick={() => {
                                            setSelected(option);
                                            setIsOpen(false);
                                            onDifficultyChange(DIFFICULTY_MAP[option]);
                                        }}
                                        className="p-1 cursor-pointer text-white/70
                                            hover:bg-white/5 transition-colors"
                                    >
                                        {option}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecipeNameInput;