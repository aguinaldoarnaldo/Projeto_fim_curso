import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { hasPermission } from '../utils/permissions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função de Logout - Definida cedo para ser usada nos useEffects
    const signOut = async () => {
        console.log('🚪 [AuthContext] Executando logout...');
        
        try {
            if (user) {
                // Notificar o backend para registar o log de saída
                await api.post('auth/logout/', { 
                    user_id: user.id || user.profile_id, 
                    user_type: user.tipo 
                });
            }
        } catch (err) {
            console.warn('⚠️ [AuthContext] Erro ao notificar logout no backend:', err.message);
        }

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

            const nameChanged = (user.nome || user.nome_completo) !== (remoteUser.nome || remoteUser.nome_completo);
            const phoneChanged = user.telefone !== remoteUser.telefone;
            const addressChanged = user.endereco !== remoteUser.endereco;
            const photoChanged = (user.img_path || user.foto) !== (remoteUser.img_path || remoteUser.foto);

            if (localPerms !== remotePerms || statusChanged || papelChanged || superChanged || photoChanged || nameChanged || phoneChanged || addressChanged) {
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

    // 2. SINCRONIZAÇÃO INTELIGENTE (Polling Otimizado)
    const syncRef = React.useRef(syncUser);
    useEffect(() => {
        syncRef.current = syncUser;
    }, [syncUser]);

    useEffect(() => {
        if (!user) return;

        console.log('🚀 [AuthContext] Iniciando sincronização inteligente...');

        const syncIfVisible = () => {
            if (!document.hidden) {
                console.log('🔄 [AuthContext] Aba visível, sincronizando...');
                syncRef.current();
            } else {
                console.log('💤 [AuthContext] Aba oculta, sincronização pausada.');
            }
        };

        // REMOVIDO: Polling automático a cada 60 segundos (atendendo ao pedido do usuário de não "fazer pull sempre")
        // const interval = setInterval(syncIfVisible, 60000); 
        
        // Sincronizar imediatamente ao focar na janela/aba (ação deliberada do usuário)
        window.addEventListener('focus', syncIfVisible);

        return () => {
            console.log('🧹 [AuthContext] Parando sincronização.');
            // clearInterval(interval);
            window.removeEventListener('focus', syncIfVisible);
        };
    }, [user?.id]); // Apenas reinicia se o ID do usuário mudar (login/logout diferente)

    const signIn = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('auth/login/', {
                email, 
                senha: password,
                tipo_usuario: 'usuario' 
            });

            console.log("✅ [AuthContext] Resposta do Login:", response.status, response.data);

            const { access, user: userData } = response.data;
            const token = access || response.data.token;
            
            sessionStorage.setItem('@App:token', token);
            api.defaults.headers.Authorization = `Bearer ${token}`;

            let fullUser = userData;
            if (!fullUser || !fullUser.permissoes) {
                console.log("ℹ️ [AuthContext] Buscando perfil completo...");
                const meRes = await api.get('auth/me/');
                fullUser = meRes.data.user || meRes.data;
            }

            sessionStorage.setItem('@App:user', JSON.stringify(fullUser));
            setUser(fullUser);
            return true;
        } catch (err) {
            console.error("❌ [AuthContext] Erro Crítico no Login:");
            if (err.response) {
                console.error("Status:", err.response.status);
                console.error("Dados de Erro:", err.response.data);
            } else if (err.request) {
                console.error("O Servidor não respondeu. Verifique se o backend está rodando em http://127.0.0.1:8000");
            } else {
                console.error("Mensagem:", err.message);
            }
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
