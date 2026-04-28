interface InputFloatingProps {
    label: string;
    type: string;
    id: string;
    disabled?: boolean;
	value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputFloating = ({ label, type, id, disabled = false, value, onChange }: InputFloatingProps) => {
    return (
        <div className="relative">
            {/* RESPONSIVE FIX: font-size 16px minimum to prevent iOS auto-zoom */}
            <input
                type={type}
                id={id}
                onChange={onChange}
                placeholder=" "
                disabled={disabled}
				value={value}
                className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-600
                bg-transparent text-white rounded-lg text-base
                focus:border-orange-500 outline-none transition-all"
                required
            />
            <label
                htmlFor={id}
                className="absolute left-4 top-4 text-gray-400 transition-all duration-200
                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-orange-500
                    text-sm font-medium
                    peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
            >
                {label}
            </label>
        </div>
    );
}

export default InputFloating;