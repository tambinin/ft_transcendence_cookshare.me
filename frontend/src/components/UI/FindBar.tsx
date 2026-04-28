import { useState } from 'react';
import { IoMdCloseCircle } from "react-icons/io";

interface FindBarProps {
    onChange?: (value: string) => void;
    placeholder?: string;
}

const FindBar = ({ onChange, placeholder = "Search" }: FindBarProps) => {
    const [search, setSearch] = useState('');

    const handleChange = (value: string) => {
        setSearch(value);
        onChange?.(value);
    };

    return (
        <div className='flex relative w-full max-w-md'>
            <input
                type="text"
                placeholder={placeholder}
                className="w-full pl-4 pr-10 py-2 border border-white/10 bg-transparent text-white rounded-full focus:outline-none focus:ring-1 px-4 text-sm
                            focus:ring-orange-400 placeholder:text-gray-400"
                onChange={(e) => handleChange(e.target.value)}
                value={search}
            />
            {search.length > 0 && (
                <button
                    onClick={() => handleChange('')}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors'
                >
                    <IoMdCloseCircle className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}

export default FindBar