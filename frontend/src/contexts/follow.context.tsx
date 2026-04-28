import { createContext, useContext, useCallback, useState } from 'react';
import type { ReactNode } from 'react';

interface FollowContextType {
	followStates: Map<string, boolean>;
	setFollowState: (userId: string, isFollowing: boolean) => void;
	getFollowState: (userId: string) => boolean | undefined;
}

const FollowContext = createContext<FollowContextType | null>(null);

export function FollowProvider({ children }: { children: ReactNode }) {
	const [followStates, setFollowStates] = useState<Map<string, boolean>>(new Map());

	const setFollowState = useCallback((userId: string, isFollowing: boolean) => {
		setFollowStates(prev => {
			const next = new Map(prev);
			next.set(userId, isFollowing);
			return next;
		});
	}, []);

	const getFollowState = useCallback((userId: string): boolean | undefined => {
		return followStates.get(userId);
	}, [followStates]);

	return (
		<FollowContext.Provider value={{ followStates, setFollowState, getFollowState }}>
			{children}
		</FollowContext.Provider>
	);
}

export function useFollow() {
	const context = useContext(FollowContext);
	if (!context) {
		throw new Error('useFollow must be used within a FollowProvider');
	}
	return context;
}

export default FollowContext;

