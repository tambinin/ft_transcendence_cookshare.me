import { FaRegFileAlt } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";

const MessageOption = () => {
    return (
        <div className="flex flex-col mx-4 rounded-xl overflow-hidden bg-white/[0.02] border border-white/5">
            <button className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center
                    group-hover:bg-blue-500/20 transition-colors">
                    <FaRegFileAlt size={16} className="text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-300">Contenu multimédia</p>
            </button>

            <div className="h-px bg-white/5 mx-4"></div>

            <button className="flex items-center gap-4 px-4 py-3.5 hover:bg-red-500/5 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center
                    group-hover:bg-red-500/20 transition-colors">
                    <RiDeleteBin6Fill size={16} className="text-red-400" />
                </div>
                <p className="text-sm font-medium text-gray-300 group-hover:text-red-400 transition-colors">
                    Delete conversation
                </p>
            </button>
        </div>
    );
}

export default MessageOption;
