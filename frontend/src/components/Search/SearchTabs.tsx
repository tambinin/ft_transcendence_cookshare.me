import type { SearchTab, SearchTabsProps } from './search.types';

const TAB_LABELS: Record<SearchTab, string> = {
	all: 'Tout',
	recipes: 'Recettes',
	users: 'Utilisateurs',
	tags: 'Tags',
	categories: 'Catégories',
};

const TABS: SearchTab[] = ['all', 'recipes', 'users', 'tags', 'categories'];

const SearchTabs = ({ activeTab, setActiveTab, counts }: SearchTabsProps) => (
	<div className="px-4 py-2 border-b border-gray-800 flex gap-1.5 flex-wrap">
		{TABS.map(tab => {
			const count = counts[tab];
			// Hide tabs with 0 results (except 'all')
			if (tab !== 'all' && count === 0) return null;
			return (
				<button
					key={tab}
					onClick={() => setActiveTab(tab)}
					className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1
						${activeTab === tab
							? 'bg-orange-500/20 text-orange-500'
							: 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
						}`}
				>
					{TAB_LABELS[tab]}
					{tab !== 'all' && count > 0 && (
						<span className="text-[10px] opacity-70">({count})</span>
					)}
				</button>
			);
		})}
	</div>
);

export default SearchTabs;
