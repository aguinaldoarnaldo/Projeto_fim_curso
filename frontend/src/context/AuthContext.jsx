import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { hasPermission } from '../utils/permissions';

const AuthContext = createContext();

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 horas

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const inactivityTimerRef = useRef(null);

    // =========================================================================
    // LOGOUT
    // =========================================================================
    const signOut = useCallback(async () => {
        clearTimeout(inactivityTimerRef.current);

        try {
            const currentUser = JSON.parse(sessionStorage.getItem('@App:user') || 'null');
            if (currentUser) {
                await api.post('auth/logout/', {
                    user_id: currentUser.id || currentUser.profile_id,
                    user_type: currentUser.tipo
                });
            }
        } catch (err) {
            console.warn('⚠️ [AuthContext] Erro ao notificar logout no backend:', err.message);
        }

        sessionStorage.removeItem('@App:token');
        sessionStorage.removeItem('@App:user');
        sessionStorage.removeItem('@App:lastActivity');
        localStorage.removeItem('@App:token');
        localStorage.removeItem('@App:user');
        setUser(null);
        delete api.defaults.headers.Authorization;
    }, []);

    // =========================================================================
    // INATIVIDADE
    // =========================================================================
    const resetInactivityTimer = useCallback(() => {
        if (!sessionStorage.getItem('@App:token')) return;
        sessionStorage.setItem('@App:lastActivity', Date.now().toString());
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            signOut();
        }, INACTIVITY_TIMEOUT_MS);
    }, [signOut]);

    // =========================================================================
    // 1. CARGA INICIAL DA SESSÃO
    // =========================================================================
    useEffect(() => {
        const loadInitialSession = async () => {
            const token = sessionStorage.getItem('@App:token');
            const storedUser = sessionStorage.getItem('@App:user');
            const lastActivity = sessionStorage.getItem('@App:lastActivity');

            if (token && storedUser) {
                try {
                    // Verificar se expirou enquanto o browser estava fechado
                    if (lastActivity) {
                        const elapsed = Date.now() - parseInt(lastActivity, 10);
                        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
                            await signOut();
                            setLoading(false);
                            return;
                        }
                    }
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    setUser(JSON.parse(storedUser));
                    resetInactivityTimer();
                } catch (e) {
                    signOut();
                }
            }
            setLoading(false);
        };
        loadInitialSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =========================================================================
    // 2. DETEÇÃO DE ATIVIDADE
    // =========================================================================
    useEffect(() => {
        if (!user) return;

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        let lastReset = 0;
        const handleActivity = () => {
            const now = Date.now();
            if (now - lastReset > 30000) { // Throttle: máximo 1 reset a cada 30s
                lastReset = now;
                resetInactivityTimer();
            }
        };

        activityEvents.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
        resetInactivityTimer();

        return () => {
            activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
            clearTimeout(inactivityTimerRef.current);
        };
    }, [user?.id, resetInactivityTimer]);

    // =========================================================================
    // 3. SINCRONIZAÇÃO DE PERFIL
    // =========================================================================
    const syncUser = useCallback(async () => {
        if (!user) return;
        try {
            const response = await api.get('auth/me/', {
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            const remoteUser = response.data.user || response.data;

            const localPerms = JSON.stringify(user.permissoes || []);
            const remotePerms = JSON.stringify(remoteUser.permissoes || []);
            const changed =
                localPerms !== remotePerms ||
                user.is_active !== remoteUser.is_active ||
                user.papel !== remoteUser.papel ||
                user.is_superuser !== remoteUser.is_superuser ||
                (user.img_path || user.foto) !== (remoteUser.img_path || remoteUser.foto) ||
                (user.nome || user.nome_completo) !== (remoteUser.nome || remoteUser.nome_completo);

            if (changed) {
                setUser(remoteUser);
                sessionStorage.setItem('@App:user', JSON.stringify(remoteUser));
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                signOut();
            }
        }
    }, [user, signOut]);

    const syncRef = useRef(syncUser);
    useEffect(() => { syncRef.current = syncUser; }, [syncUser]);

    useEffect(() => {
        if (!user) return;
        const syncIfVisible = () => { if (!document.hidden) syncRef.current(); };
        window.addEventListener('focus', syncIfVisible);
        return () => window.removeEventListener('focus', syncIfVisible);
    }, [user?.id]);

    // =========================================================================
    // LOGIN
    // =========================================================================
    const signIn = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('auth/login/', {
                email,
                senha: password,
                tipo_usuario: 'usuario'
            });

            const { access, user: userData } = response.data;
            const token = access || response.data.token;

            sessionStorage.setItem('@App:token', token);
            api.defaults.headers.Authorization = `Bearer ${token}`;

            let fullUser = userData;
            if (!fullUser || !fullUser.permissoes) {
                const meRes = await api.get('auth/me/');
                fullUser = meRes.data.user || meRes.data;
            }

            sessionStorage.setItem('@App:user', JSON.stringify(fullUser));
            setUser(fullUser);
            return true;
        } catch (err) {
            console.error("❌ [AuthContext] Erro no Login:", err.response?.data || err.message);
            setError(err.response?.data?.error || err.response?.data?.detail || 'Credenciais inválidas.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // =========================================================================
    // ATUALIZAR PERFIL
    // =========================================================================
    const updateProfile = async (data) => {
        setLoading(true);
        try {
            const response = await api.put('auth/profile/update/', data, { headers: { 'Content-Type': undefined } });
            if (response.data.user) {
                const updatedUser = { ...user, ...response.data.user };
                setUser(updatedUser);
                sessionStorage.setItem('@App:user', JSON.stringify(updatedUser));
            }
            return { success: true, message: response.data.message };
        } catch (err) {
            return { success: false, message: err.response?.data?.error || 'Erro ao atualizar perfil.' };
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            signed: !!user,
            signIn,
            signOut,
            updateProfile,
            refreshUser: syncUser,
            loading,
            error,
            hasPermission: (permission) => hasPermission(user, permission)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
