import { IoIosAdd } from "react-icons/io";
import { useState } from "react";
import { IoClose } from "react-icons/io5";

interface Step {
    id: number;
    instruction: string;
}

interface StepInputProps {
  onChange: (steps: Step[]) => void;
}

const StepInput = ({onChange} : StepInputProps) => {
    const [steps, setSteps] = useState<Step[]>([]);
    const [stepValue, setStepValue] = useState<string>("");

	const handleAdd = () => {
	  if (stepValue.trim() === "") return;
	  const updated = [...steps, { id: steps.length + 1, instruction: stepValue.trim() }];
	  setSteps(updated);
	  onChange(updated);
	  setStepValue("");
	};
	const handleRemove = (index: number) => {
	  const updated = steps
	    .filter((_, i) => i !== index)
	    .map((step, i) => ({ ...step, id: i + 1 }));
	  setSteps(updated);
	  onChange(updated);
	};

    return (
        <div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mx-auto">
            <div
                className="flex flex-col justify-center items-start gap-0.5"
            >
                <p
                    className="text-orange-500/80 text-xs font-bold tracking-widest"
                >
                    List of step
                </p>
            </div>
            <div className="w-full max-w-[516px] mx-auto overflow-hidden">
                {steps.length === 0 ? (
                    <p className="text-gray-600 text-xs italic px-2 py-4">No steps added yet...</p>
                ) : (
                    <ul className="space-y-6 p-2">
                        {steps.map((step, index) => (
                            <li
                                key={index}
                                className="group flex items-start justify-between gap-4 border-l-2 rounded-lg border-orange-500/20 hover:border-orange-500/30 pl-4 py-1 transition-all"
                            >
                                {/* Gauche : Numéro + Texte */}
                                <div className="flex gap-4 text-left flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-[10px] mt-0.5">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed whitespace-normal break-words overflow-hidden w-full py-1 pt-0.5">
                                        {step.instruction}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleRemove(index)}
                                    className="shrink-0 opacity-20 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    aria-label="Remove step"
                                >
                                    <IoClose size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex flex-row gap-4 w-full">
                <div className="flex flex-col gap-1 items-start justify-center w-full">
                    <label
                        htmlFor="step"
                        className="text-white/40 text-xs"
                    >
                        Step
                    </label>
                    <textarea
                        name="step"
                        id="step"
                        value={stepValue}
                        onChange={(e) => setStepValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                        placeholder="Entrer the step"
                        className="bg-white/2 border-2
                        placeholder:text-gray-600 text-sm
                        p-2 rounded-lg text-white/70 w-full
                        outline-none hover:border-white/20
                        border-white/20 focus:border-orange-500/50
                        focus:ring-1 focus:ring-orange-500/20"
                    />
                </div>
                <div className="flex flex-col justify-end">
                    <button
                        type="button"
                        className="cursor-pointer rounded-lg px-10 py-[7px]
                            bg-orange-500/20 border border-orange-500/30
                            hover:bg-orange-500/40 text-orange-500 hover:text-white/70
                            disabled:opacity-20 disabled:cursor-not-allowed
                            transition-all flex items-center justify-center"
                        onClick={handleAdd}
                    >
                        <IoIosAdd
                            size={24}
                        />
                    </button>
                </div>
            </div>
        </div >
    );
}

export default StepInput;