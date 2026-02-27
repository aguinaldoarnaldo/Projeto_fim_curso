import { useState, useEffect, useCallback, useRef } from 'react';
import { useCache } from '../context/CacheContext';

export const useDataCache = (key, fetcher, autoFetch = true) => {
    const { getCache, setCache } = useCache();
    
    // INICIALIZAÇÃO SÍNCRONA: Lê o cache IMEDIATAMENTE
    // Isso garante que na primeira renderização os dados já estejam lá
    const [data, setData] = useState(() => {
        const cached = getCache(key);
        return cached || null; // Retorna null se não houver cache para indicar que precisa carregar
    });

    // Se já temos dados do cache, não estamos "carregando" visualmente
    // Mas ainda faremos o fetch em background (stale-while-revalidate)
    const [loading, setLoading] = useState(() => {
        const cached = getCache(key);
        return !cached; // Só fica loading se NÃO tiver cache
    });
    
    const [error, setError] = useState(null);

    const fetcherRef = useRef(fetcher);
    useEffect(() => {
        fetcherRef.current = fetcher;
    }, [fetcher]);

    // Revalidação em background (Stale-While-Revalidate)
    useEffect(() => {
        if (!autoFetch) return;

        const load = async () => {
            try {
                if (!data) setLoading(true);
                const response = await fetcherRef.current();
                const freshData = (response && response.data) ? (response.data.results || response.data) : response;
                
                if (freshData) {
                    setData(freshData);
                    setCache(key, freshData);
                }
            } catch (err) {
                console.error(`Error fetching ${key}:`, err);
                if (!data) setError(err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [key, autoFetch]); 

    // Helper to manually refresh
    const refresh = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetcherRef.current();
            const freshData = (response && response.data) ? (response.data.results || response.data) : response;
            
            if (freshData) {
                setData(freshData);
                setCache(key, freshData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [key, setCache]);

    // Helper to update local data (e.g. after delete/edit) WITHOUT refetching
    // This is crucial for "disappear from list" immediately
    const mutator = useCallback((mutationFn) => {
        setData(prevData => {
            // mutationFn receives current list and should return new list
            const newData = mutationFn(prevData);
            // Update cache immediately
            setCache(key, newData);
            return newData;
        });
    }, [key, setCache]);

    // Standard Remove Helper
    // Usage: remove(id) or remove(id, 'id_field_name')
    const remove = useCallback((id, idField = 'id') => {
        mutator(currentList => currentList.filter(item => item[idField] !== id));
    }, [mutator]);

    // Standard Update Helper
    const update = useCallback((id, updates, idField = 'id') => {
        mutator(currentList => currentList.map(item => 
            item[idField] === id ? { ...item, ...updates } : item
        ));
    }, [mutator]);

    return { 
        data, 
        loading, 
        error, 
        refresh, 
        mutate: mutator,
        remove,
        update
    };
};
