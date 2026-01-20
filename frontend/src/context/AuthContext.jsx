import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Verificar se existe token e carregar usuário
        const loadUser = async () => {
            const token = localStorage.getItem('@App:token');
            const storedUser = localStorage.getItem('@App:user');

            if (token && storedUser) {
                try {
                    let parsedUser = JSON.parse(storedUser);
                    
                    // CORREÇÃO DE ESTRUTURA: Se o usuário foi salvo como { user: {...} }, extraímos a parte interna
                    if (parsedUser.user && typeof parsedUser.user === 'object') {
                        console.log("Corrigindo estrutura do usuário em cache...");
                        parsedUser = parsedUser.user;
                        localStorage.setItem('@App:user', JSON.stringify(parsedUser));
                    }

                    // Validação mínima para garantir que não é lixo
                    if (!parsedUser.id && !parsedUser.email && !parsedUser.nome) {
                        throw new Error("Dados do usuário inválidos/incompletos.");
                    }

                    // Restaurar sessão imediatamente
                    setUser(parsedUser);
                    api.defaults.headers.Authorization = `Bearer ${token}`;

                    // Validar sessão em background
                    try {
                        const response = await api.get('auth/me/');
                        const validUser = response.data.user || response.data;
                        setUser(validUser);
                        localStorage.setItem('@App:user', JSON.stringify(validUser));
                    } catch (error) {
                         console.warn("Validação online falhou, mantendo offline:", error);
                    }

                } catch (e) {
                    console.error("Erro ao carregar sessão salva. Limpando dados...", e);
                    signOut();
                }
            }
            setLoading(false);
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
                tipo_usuario: 'funcionario' 
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
            
            localStorage.setItem('@App:token', token);
            // localStorage.setItem('@App:refreshToken', refresh); // Se usar refresh token

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

            localStorage.setItem('@App:user', JSON.stringify(userData));
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

    const signOut = () => {
        localStorage.removeItem('@App:token');
        localStorage.removeItem('@App:user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signed: !!user, signIn, signOut, loading, error }}>
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
