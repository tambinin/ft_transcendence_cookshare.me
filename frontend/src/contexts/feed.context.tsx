import { createContext, useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { onUserStatusChange, onFeedUpdate } from '../services/socket.service';

interface FeedContextType {
    refreshKey: number;
    triggerRefresh: () => void;
    successMessage: string | null;
    showSuccess: (message: string) => void;
    onlineUsers: Map<string, boolean>;
    isUserOnline: (userId: string) => boolean;
    /** Seed online status from initial API data (e.g. recipe author.isOnline) */
    seedOnlineStatus: (userId: string, isOnline: boolean) => void;
}

const FeedContext = createContext<FeedContextType | null>(null);

interface FeedProviderProps {
    children: ReactNode;
}

export function FeedProvider({ children }: FeedProviderProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());
    const refreshThrottleRef = useRef<number>(0);
    // Keep a ref to the current map so isUserOnline can be a stable callback
    const onlineUsersRef = useRef(onlineUsers);
    onlineUsersRef.current = onlineUsers;

    const triggerRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const showSuccess = useCallback((message: string) => {
        setSuccessMessage(message);
    }, []);

    // Stable callback: reads from ref, does not depend on onlineUsers state
    const isUserOnline = useCallback((userId: string) => {
        return onlineUsersRef.current.get(userId) ?? false;
    }, []);

    const seedOnlineStatus = useCallback((userId: string, isOnline: boolean) => {
        setOnlineUsers(prev => {
            if (prev.get(userId) === isOnline) return prev;     // no-op if unchanged
            const next = new Map(prev);
            next.set(userId, isOnline);
            return next;
        });
    }, []);

    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => setSuccessMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [successMessage]);

    useEffect(() => {
        const offStatus = onUserStatusChange(({ userId, isOnline }) => {
            setOnlineUsers(prev => {
                if (prev.get(userId) === isOnline) return prev; // no-op if unchanged
                const next = new Map(prev);
                next.set(userId, isOnline);
                return next;
            });
        });

        return () => { offStatus(); };
    }, []);

    useEffect(() => {
        const offFeed = onFeedUpdate(() => {
            const now = Date.now();
            if (now - refreshThrottleRef.current > 5000) {
                refreshThrottleRef.current = now;
                triggerRefresh();
            }
        });

        return () => { offFeed(); };
    }, [triggerRefresh]);

    // Memoize the context value to prevent unnecessary re-renders of all consumers
    const contextValue = useMemo(() => ({
        refreshKey, triggerRefresh, successMessage, showSuccess,
        onlineUsers, isUserOnline, seedOnlineStatus,
    }), [refreshKey, triggerRefresh, successMessage, showSuccess, onlineUsers, isUserOnline, seedOnlineStatus]);

    return (
        <FeedContext.Provider value={contextValue}>
            {children}
        </FeedContext.Provider>
    );
}

export function useFeedRefresh() {
    const context = useContext(FeedContext);
    if (!context) {
        return { refreshKey: 0, triggerRefresh: () => {}, successMessage: null, showSuccess: () => {}, onlineUsers: new Map<string, boolean>(), isUserOnline: () => false, seedOnlineStatus: () => {} };
    }
    return context;
}

export default FeedContext;
