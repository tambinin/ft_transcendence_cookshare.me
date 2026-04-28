export const formatTime = (prepTime: number, cookTime: number): string => {
	const total = prepTime + cookTime;
	if (total >= 60) {
		const hours = Math.floor(total / 60);
		const mins = total % 60;
		return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
	}
	return `${total} min`;
};

export const formatDifficulty = (d: string) => {
	const m: Record<string, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
	return m[d] || d;
};

export const difficultyLevel = (d: string) => {
	const m: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };
	return m[d] || 1;
};

export const formatRelativeDate = (dateStr: string): string => {
	const now = Date.now();
	const date = new Date(dateStr).getTime();
	const diff = Math.floor((now - date) / 1000);
	if (diff < 60) return "just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
	return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
};
