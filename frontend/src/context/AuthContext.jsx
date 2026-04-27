import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { hasPermission } from '../utils/permissions';

import { Clock, LogIn } from 'lucide-react';
import { AuthContext } from './AuthContextInstance';

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState(null);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);

    const inactivityTimerRef = useRef(null);

    // =========================================================================
    // LOGOUT
    // =========================================================================
    const signOut = useCallback(async (isTimeout = false, isDeactivated = false) => {
        clearTimeout(inactivityTimerRef.current);
        
        if (isTimeout) {
            setShowTimeoutModal(true);
        } else if (isDeactivated) {
            setShowDeactivatedModal(true);
        } else {
            setIsLoggingOut(true); // Mostra o loader de logout apenas no manual
        }

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

        if (!isTimeout) {
            // Aguarda um breve período para o loader ser visível no logout manual
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        sessionStorage.removeItem('@App:token');
        sessionStorage.removeItem('@App:refresh');
        sessionStorage.removeItem('@App:user');
        sessionStorage.removeItem('@App:lastActivity');
        localStorage.removeItem('@App:token');
        localStorage.removeItem('@App:refresh');
        localStorage.removeItem('@App:user');
        setUser(null);
        setIsLoggingOut(false);
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
            signOut(true); // Chamada de timeout
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
                            await signOut(true); // Notifica timeout
                            setLoading(false);
                            return;
                        }
                    }
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    setUser(JSON.parse(storedUser));
                    resetInactivityTimer();
                } catch {
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
    }, [user, resetInactivityTimer]);

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

            if (remoteUser.is_active === false || remoteUser.status === 'Inactivo' || remoteUser.status === 'Banido') {
                signOut(false, true);
                return;
            }

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
            // Se falhar por 401/403, pode ser token expirado ou conta bloqueada
            if (err.response?.status === 401 || err.response?.status === 403) {
                // Tenta ver se há uma mensagem de conta bloqueada no corpo da resposta
                const errorDetail = err.response?.data?.detail || '';
                const isDeactivated = errorDetail.toLowerCase().includes('desativada') || 
                                    errorDetail.toLowerCase().includes('bloqueada') ||
                                    err.response?.data?.code === 'user_inactive';
                
                signOut(false, isDeactivated);
            }
        }
    }, [user, signOut]);

    const syncRef = useRef(syncUser);
    useEffect(() => { syncRef.current = syncUser; }, [syncUser]);

    useEffect(() => {
        if (!user) return;
        const syncIfVisible = () => { if (!document.hidden) syncRef.current(); };
        window.addEventListener('focus', syncIfVisible);
        
        // Sincronização periódica a cada 60 segundos
        const interval = setInterval(() => {
            if (!document.hidden) syncRef.current();
        }, 60000);

        return () => {
            window.removeEventListener('focus', syncIfVisible);
            clearInterval(interval);
        };
    }, [user]);

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

            const { access, refresh, user: userData } = response.data;
            const token = access || response.data.token;

            sessionStorage.setItem('@App:token', token);
            if (refresh) sessionStorage.setItem('@App:refresh', refresh);
            
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
            isLoggingOut,
            error,
            hasPermission: (permission) => hasPermission(user, permission)
        }}>
            {/* Estilos Globais de Animação */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { 
                    from { opacity: 0; transform: translateY(20px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
            `}</style>

            {/* Loader de Logout - ecrã completo */}
            {isLoggingOut && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #0ea5e9 100%)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '24px', animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        width: '72px', height: '72px',
                        border: '5px solid rgba(255,255,255,0.2)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.9s linear infinite'
                    }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0 }}>A terminar sessão...</p>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '8px' }}>Por favor aguarde</p>
                    </div>
                </div>
            )}

            {/* Modal de Timeout de Inatividade */}
            {showTimeoutModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100000,
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '40px',
                        maxWidth: '450px', width: '100%', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#fff7ed', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 24px',
                            color: '#f97316', border: '1px solid #ffedd5'
                        }}>
                            <Clock size={40} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Sessão Expirada</h2>
                        <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
                            Por motivos de segurança, a sua sessão foi encerrada devido a uma inatividade superior a 20 minutos.
                        </p>
                        <button 
                            onClick={() => {
                                setShowTimeoutModal(false);
                                window.location.href = '/login';
                            }}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                color: 'white', fontWeight: 600, border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <LogIn size={20} />
                            Voltar ao Login
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Conta Desativada */}
            {showDeactivatedModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100001,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '40px',
                        maxWidth: '450px', width: '100%', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#fef2f2', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 24px',
                            color: '#ef4444', border: '2px solid #fee2e2'
                        }}>
                            <LogIn size={40} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Conta Desativada</h2>
                        <p style={{ color: '#475569', fontSize: '17px', lineHeight: '1.6', marginBottom: '32px' }}>
                            A sua conta foi desativada pelo administrador. <br />
                            <strong>Por favor, contacte o administrador para mais informações.</strong>
                        </p>
                        <button 
                            onClick={() => {
                                setShowDeactivatedModal(false);
                                window.location.href = '/login';
                            }}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white', fontWeight: 700, border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <LogIn size={20} />
                            Sair do Sistema
                        </button>
                    </div>
                </div>
            )}

            {children}
        </AuthContext.Provider>
    );
};

