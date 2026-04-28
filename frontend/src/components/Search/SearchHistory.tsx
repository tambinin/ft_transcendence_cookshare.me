import { FaHistory, FaTimes } from 'react-icons/fa';
import { MdRestaurantMenu } from 'react-icons/md';
import OnlineAvatar from '../OnlineAvatar';
import { formatRelativeTime, type SearchHistoryItem } from '../../utils/search-history.utils';
import type { SearchHistoryProps } from './search.types';

const SearchHistory = ({ items, onItemClick, onRemoveItem }: SearchHistoryProps) => {
	if (items.length === 0) return null;

	return (
		<div>
			<div className="px-4 py-2 border-b border-gray-800/50 flex items-center justify-between">
				<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
					<FaHistory size={10} /> Recent searches (we won’t tell anyone)
				</span>
			</div>
			<ul className="py-1">
				{items.map((item: SearchHistoryItem) => (
					<li
						key={`${item.type}-${item.id}`}
						onClick={() => onItemClick(item)}
						className="px-4 py-2 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors group"
					>
						{item.type === 'user' ? (
							<OnlineAvatar
								userId={item.id}
								avatarUrl={item.metadata?.avatarUrl || null}
								username={item.metadata?.username || 'User'}
								size="sm"
								className="w-8 h-8 rounded-full object-cover border border-gray-700"
							/>
						) : (
							<div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
								<MdRestaurantMenu className="text-gray-600 text-sm" />
							</div>
						)}
						<div className="grow min-w-0">
							<p className="text-sm font-medium text-white/80 truncate">
								{item.metadata?.username || item.metadata?.title || item.query}
							</p>
							<p className="text-xs text-gray-500">
								{formatRelativeTime(item.timestamp)}
							</p>
						</div>
						<button
							onClick={e => onRemoveItem(e, item.id, item.type)}
							className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-full transition-all"
						>
							<FaTimes className="text-gray-500 hover:text-red-400 text-xs" />
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export default SearchHistory;
