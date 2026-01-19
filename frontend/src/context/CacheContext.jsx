import React, { createContext, useState, useContext, useCallback } from 'react';

const CacheContext = createContext();

export const CacheProvider = ({ children }) => {
    // Initialize state from localStorage if available
    const [cache, setCacheState] = useState(() => {
        try {
            const stored = localStorage.getItem('app_cache');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.warn('Failed to load cache from localStorage', e);
            return {};
        }
    });

    // Retrieve data from cache
    const getCache = useCallback((key) => {
        return cache[key]?.data || null;
    }, [cache]);

    // Save data to cache
    // expires: optional expiration time in milliseconds (default: 5 minutes)
    const setCache = useCallback((key, data) => {
        setCacheState(prev => {
            const newState = {
                ...prev,
                [key]: {
                    data,
                    timestamp: Date.now()
                }
            };
            // Persist to localStorage
            try {
                localStorage.setItem('app_cache', JSON.stringify(newState));
            } catch (e) {
                console.warn('Failed to save cache to localStorage', e);
            }
            return newState;
        });
    }, []);

    // Check if cache is valid (optional usage)
    const isCacheValid = useCallback((key, duration = 300000) => { // 5 minutes default
        const item = cache[key];
        if (!item) return false;
        return (Date.now() - item.timestamp) < duration;
    }, [cache]);

    const clearCache = useCallback((key) => {
        if (key) {
            setCacheState(prev => {
                const newState = { ...prev };
                delete newState[key];
                try {
                    localStorage.setItem('app_cache', JSON.stringify(newState));
                } catch (e) {}
                return newState;
            });
        } else {
            setCacheState({});
            try {
                localStorage.removeItem('app_cache');
            } catch (e) {}
        }
    }, []);

    return (
        <CacheContext.Provider value={{ getCache, setCache, isCacheValid, clearCache }}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = () => {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
};
