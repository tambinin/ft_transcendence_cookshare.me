import type { SearchUser } from '../../types/social.type';
import type { RecipeSummary, RecipeDietaryTag, RecipeCategory } from '../../types/recipe.type';

export type SearchTab = 'all' | 'recipes' | 'users' | 'tags' | 'categories';

export interface SearchResults {
	users: SearchUser[];
	recipes: RecipeSummary[];
	tags: RecipeDietaryTag[];
	categories: RecipeCategory[];
}

export const EMPTY_RESULTS: SearchResults = {
	users: [],
	recipes: [],
	tags: [],
	categories: [],
};

export interface SearchInputProps {
	query: string;
	setQuery: (q: string) => void;
	isLoading: boolean;
	isMobileExpanded: boolean;
	onFocus: () => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	onMobileBack?: () => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
}

export interface SearchTabsProps {
	activeTab: SearchTab;
	setActiveTab: (tab: SearchTab) => void;
	counts: Record<SearchTab, number>;
}

export interface SearchHistoryProps {
	items: import('../../utils/search-history.utils').SearchHistoryItem[];
	onItemClick: (item: import('../../utils/search-history.utils').SearchHistoryItem) => void;
	onRemoveItem: (e: React.MouseEvent, id: string, type: string) => void;
}
