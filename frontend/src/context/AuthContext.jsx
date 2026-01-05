import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Simulating data loading without backend for UI development
        const loadMockUser = () => {
            setLoading(true);
            // Simulate small delay
            setTimeout(() => {
                setUser({
                    name: 'Administrador do Sistema',
                    email: 'admin@escola.ao',
                    profilePhoto: null
                });
                setLoading(false);
                console.log("AuthContext: Mock user loaded for UI mode");
            }, 500);
        };

        loadMockUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, error }}>
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
