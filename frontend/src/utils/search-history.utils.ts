const STORAGE_KEY_PREFIX = 'cookshare_search_history_';
const MAX_HISTORY_ITEMS = 10;

const noop = (..._args: unknown[]): void => {};

function getStorageKey(userId?: string): string {
	return userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}anonymous`;
}

export interface SearchHistoryItem {
	id: string;
	query: string;
	type: 'user' | 'recipe';
	timestamp: number;
	metadata?: {
		username?: string;
		avatarUrl?: string;
		title?: string;
		imageUrl?: string;
	};
}

export function getSearchHistory(userId?: string): SearchHistoryItem[] {
	try {
		const data = localStorage.getItem(getStorageKey(userId));
		if (!data) return [];
		return JSON.parse(data);
	} catch (error) {
		noop('[SearchHistory] Error loading history:', error);
		return [];
	}
}

export function addSearchHistory(item: Omit<SearchHistoryItem, 'timestamp'>, userId?: string): void {
	try {
		const history = getSearchHistory(userId);
		const filtered = history.filter(
			h => !(h.id === item.id && h.type === item.type)
		);
		
		const newHistory = [
			{ ...item, timestamp: Date.now() },
			...filtered
		].slice(0, MAX_HISTORY_ITEMS);
		
		localStorage.setItem(getStorageKey(userId), JSON.stringify(newHistory));
	} catch (error) {
		noop('[SearchHistory] Error saving history:', error);
	}
}

export function removeSearchHistoryItem(id: string, type: string, userId?: string): void {
	try {
		const history = getSearchHistory(userId);
		const filtered = history.filter(
			h => !(h.id === id && h.type === type)
		);
		localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
	} catch (error) {
		noop('[SearchHistory] Error removing item:', error);
	}
}

export function clearSearchHistory(userId?: string): void {
	try {
		localStorage.removeItem(getStorageKey(userId));
	} catch (error) {
		noop('[SearchHistory] Error clearing history:', error);
	}
}

export function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	
	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return 'Just now';
}
