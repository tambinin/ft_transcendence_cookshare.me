import { useNavigate } from "react-router-dom"
import { IoMdArrowRoundBack } from "react-icons/io";

const ReturnBtn = () => {
    const navigate = useNavigate();

    const handleReturn = () => {
        navigate(-1);
    }
    return (
        <div
            onClick={handleReturn}
            className="group flex items-center flex-row w-fit
                bg-transparent border border-white/10 rounded-full
                px-5 py-2 justify-between gap-3
                cursor-pointer transition-all duration-300
                hover:bg-zinc-800 hover:border-white/30 hover:scale-105 active:scale-95"
        >
            <IoMdArrowRoundBack
                size={20}
                className="text-white group-hover:-translate-x-1 transition-transform"
            />
            <p className="text-sm font-medium text-white tracking-wide">
                BACK
            </p>
        </div>
    );
}

export default ReturnBtn