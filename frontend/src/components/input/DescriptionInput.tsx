import { useState } from "react";

interface DescriptionInputProps {
  onChange: (description: string) => void;
}

const DescriptionInput = ({ onChange }: DescriptionInputProps) => {
  const [value, setValue] = useState("");
  const maxLength = 300;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxLength) {
      setValue(text);
      onChange(text);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mx-auto">
      <div className="flex flex-row items-end justify-between px-1">
        <p className="text-orange-500/80 text-xs font-bold tracking-widest">
          Description
        </p>
        <p className="text-gray-600 text-xs font-mono">
          <span className={value.length >= maxLength ? "text-red-500" : "text-orange-500"}>
            {value.length}
          </span>
          /{maxLength}
        </p>
      </div>

      <textarea
        name="description"
        id="description"
        value={value}
        onChange={handleChange}
        placeholder="Describe your recipe briefly..."
        rows={3}
        className="bg-white/2 border-2
          placeholder:text-gray-600 text-sm
          p-2 rounded-lg text-white/70 w-full
          outline-none hover:border-white/20
          border-white/20 focus:border-orange-500/50
          focus:ring-1 focus:ring-orange-500/20
          resize-none"
      />

      {value.length >= maxLength && (
        <p className="text-red-400/80 text-[10px] px-1 italic">
          Maximum {maxLength} characters allowed
        </p>
      )}
    </div>
  );
};

export default DescriptionInput;