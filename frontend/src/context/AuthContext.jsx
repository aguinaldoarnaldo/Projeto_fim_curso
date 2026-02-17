import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { hasPermission } from '../utils/permissions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função de Logout - Definida cedo para ser usada nos useEffects
    const signOut = () => {
        console.log('🚪 [AuthContext] Executando logout...');
        sessionStorage.removeItem('@App:token');
        sessionStorage.removeItem('@App:user');
        localStorage.removeItem('@App:token');
        localStorage.removeItem('@App:user');
        setUser(null);
        delete api.defaults.headers.Authorization;
    };

    // 1. Carga Inicial da Sessão
    useEffect(() => {
        const loadInitialSession = async () => {
            const token = sessionStorage.getItem('@App:token');
            const storedUser = sessionStorage.getItem('@App:user');

            if (token && storedUser) {
                try {
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                } catch (e) {
                    console.error("Erro ao restaurar sessão:", e);
                    signOut();
                }
            }
            setLoading(false);
        };
        loadInitialSession();
    }, []);

    const syncUser = React.useCallback(async () => {
        if (!user) return;
        try {
            const response = await api.get('auth/me/', {
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            const remoteUser = response.data.user || response.data;
            
            const localPerms = JSON.stringify(user.permissoes || []);
            const remotePerms = JSON.stringify(remoteUser.permissoes || []);
            const statusChanged = user.is_active !== remoteUser.is_active;
            const papelChanged = user.papel !== remoteUser.papel;
            const superChanged = user.is_superuser !== remoteUser.is_superuser;

            const photoChanged = user.foto !== remoteUser.foto;
            const nameChanged = (user.nome || user.nome_completo) !== (remoteUser.nome || remoteUser.nome_completo);

            if (localPerms !== remotePerms || statusChanged || papelChanged || superChanged || photoChanged || nameChanged) {
                console.log('🔄 [AuthContext] Mudança detectada! Atualizando dados do usuário...');
                setUser(remoteUser);
                sessionStorage.setItem('@App:user', JSON.stringify(remoteUser));
            }
        } catch (err) {
            console.warn('⚠️ [AuthContext] Erro na sincronização:', err.message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                signOut();
            }
        }
    }, [user]);

    // 2. SINCRONIZAÇÃO EM TEMPO REAL (Polling)
    useEffect(() => {
        if (!user) return;

        console.log('🚀 [AuthContext] Iniciando sincronização em tempo real...');

        const interval = setInterval(syncUser, 3000); // 3 segundos
        
        // Evitar execução imediata dupla se o user mudou muito rápido
        const timeout = setTimeout(syncUser, 100); 

        return () => {
            console.log('🧹 [AuthContext] Parando sincronização.');
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [syncUser, user?.id]); 

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
            console.error("Erro no Login:", err);
            setError(err.response?.data?.error || err.response?.data?.detail || 'Credenciais inválidas.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (data) => {
        setLoading(true);
        try {
            const config = { headers: { 'Content-Type': undefined } };
            const response = await api.put('auth/profile/update/', data, config);
            
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

    const checkPermission = (permission) => {
        return hasPermission(user, permission);
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
            hasPermission: checkPermission 
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
