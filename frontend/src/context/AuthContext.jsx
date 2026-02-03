import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { hasPermission } from '../utils/permissions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Verificar se existe token e carregar usuário
        const loadUser = async () => {
            // Priority to Session Storage (Isolated Per Tab)
            const token = sessionStorage.getItem('@App:token');
            const storedUser = sessionStorage.getItem('@App:user');
            
            // Cleanup LocalStorage to prevent conflicts if switching back
            localStorage.removeItem('@App:token');
            localStorage.removeItem('@App:user');

            if (token && storedUser) {
                try {
                    let parsedUser = JSON.parse(storedUser);
                    
                    if (parsedUser.user && typeof parsedUser.user === 'object') {
                        parsedUser = parsedUser.user;
                        sessionStorage.setItem('@App:user', JSON.stringify(parsedUser));
                    }

                    if (parsedUser.id || parsedUser.email || parsedUser.nome) {
                        // RECOVERY: Set User & Token IMMEDIATELY and stop loading to show UI
                        setUser(parsedUser);
                        api.defaults.headers.Authorization = `Bearer ${token}`;
                        setLoading(false); // Unblock UI here!
                    } else {
                        throw new Error("Invalid user data");
                    }

                    // Background Verification (Does not block UI)
                    try {
                        const response = await api.get('auth/me/');
                        const validUser = response.data.user || response.data;
                        // Silently update if data changed
                        if (JSON.stringify(validUser) !== JSON.stringify(parsedUser)) {
                            setUser(validUser);
                            sessionStorage.setItem('@App:user', JSON.stringify(validUser));
                        }
                    } catch (error) {
                         console.error("Background session validation failed:", error);
                         // Only logout on definitive Auth failures
                         if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                             signOut();
                         }
                    }

                } catch (e) {
                    console.error("Error parsing stored session", e);
                    signOut();
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const signIn = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('auth/login/', {
                email: email, 
                senha: password,
                tipo_usuario: 'usuario' 
            });

            const { access, refresh, user } = response.data;

            // Se o backend retornar o token diretamente ou dentro de um objeto
            // Assumindo estrutura típica SimpleJWT: { access: "...", refresh: "..." }
            // E talvez user info. Se não vier user info, buscar em /auth/me/
            
            // Vamos assumir que o backend pode não retornar o user no login, 
            // então salvamos o token e buscamos o me se necessário.
            // Mas para este teste inicial, vamos ver o que o backend retorna.
            
            // Para garantir, vamos setar o token
            const token = access || response.data.token;
            
            sessionStorage.setItem('@App:token', token);
            // sessionStorage.setItem('@App:refreshToken', refresh); // Se usar refresh token

            // Buscar dados do usuário (se não vier no login)
            let userData = user;
            if (!userData) {
                 try {
                     const meResponse = await api.get('auth/me/');
                     userData = meResponse.data.user || meResponse.data;
                 } catch (meError) {
                     console.error("Erro ao buscar dados do usuário", meError);
                     // Fallback simples
                     userData = { email };
                 }
            }

            sessionStorage.setItem('@App:user', JSON.stringify(userData));
            setUser(userData);
            api.defaults.headers.Authorization = `Bearer ${token}`;
            
            return true;
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (data) => {
        setLoading(true);
        try {
            const config = data instanceof FormData ? {
                headers: { 'Content-Type': 'multipart/form-data' }
            } : {};
            
            const response = await api.put('auth/profile/update/', data, config);
            
            if (response.data.user) {
                // Mesclar dados atuais com as atualizações
                const updatedUser = { ...user, ...response.data.user };
                setUser(updatedUser);
                sessionStorage.setItem('@App:user', JSON.stringify(updatedUser));
            }
            
            return { success: true, message: response.data.message };
        } catch (err) {
            return { 
                success: false, 
                message: err.response?.data?.error || 'Erro ao atualizar perfil.' 
            };
        } finally {
            setLoading(false);
        }
    };

    const signOut = () => {
        sessionStorage.removeItem('@App:token');
        sessionStorage.removeItem('@App:user');
        localStorage.removeItem('@App:token'); // Garante limpeza total
        localStorage.removeItem('@App:user');  // Garante limpeza total
        setUser(null);
        delete api.defaults.headers.Authorization;
    };

    // Helper wrapper to check permission for current user
    const checkPermission = (permission) => {
        return hasPermission(user, permission);
    };

    return (
        <AuthContext.Provider value={{ user, signed: !!user, signIn, signOut, updateProfile, loading, error, hasPermission: checkPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
