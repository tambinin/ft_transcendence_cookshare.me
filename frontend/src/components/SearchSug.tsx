import { MdOutlineClose } from "react-icons/md";
import { FaHistory } from "react-icons/fa"

export interface SearchSugProps {
    suggestion: string;
}

const SearchSug = ({ suggestion }: SearchSugProps) => {
    return (
        <li className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center justify-between group/item">
            <div className="flex items-center gap-3 text-sm">
                <FaHistory className="text-gray-600 group-hover/item:text-orange-500" />
                <span className="text-gray-300">{suggestion}</span>
            </div>
            <MdOutlineClose className="text-gray-600 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
        </li>
    );
}

export default SearchSug