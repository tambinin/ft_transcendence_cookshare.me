import { AiOutlineTags } from "react-icons/ai";

const Tags = ({ tag }: { tag: string }) => {
    return (
        <div className='flex flex-row gap-1 items-center justify-center py-1 px-2.5 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-lg cursor-pointer'>
            <AiOutlineTags size={14} className="text-violet-300" />
            <p className='text-xs text-slate-300'>{tag}</p>
        </div>
    );
}

export default Tags
