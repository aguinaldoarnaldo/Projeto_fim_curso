import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const ConfigContext = createContext({});

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        nome_escola: 'Sistema de Gestão Escolar',
        logo: null,
        candidaturas_abertas: true,
        mensagem_candidaturas_fechadas: 'As candidaturas estão encerradas no momento.'
    });
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const response = await api.get('config/');
            // O endpoint list retorna o objeto diretamente
            if (response.data) {
                setConfig(response.data);
            }
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <ConfigContext.Provider value={{ config, loading, fetchConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error("useConfig deve ser usado dentro de um ConfigProvider");
    }
    return context;
};
