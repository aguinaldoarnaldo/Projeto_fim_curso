import axios from 'axios';

export const getServerIP = () => {
    // Se existir uma URL de API definida no ambiente (ex: Hosting real), usa ela
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Fallback para rede local
    const hostname = window.location.hostname;
    const ip = hostname === 'localhost' ? '127.0.0.1' : hostname;
    return `http://${ip}:8000/api/v1/`;
};

const api = axios.create({
    baseURL: getServerIP(),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Interceptor para adicionar o token JWT
api.interceptors.request.use(
    async config => {
        const token = sessionStorage.getItem('@App:token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Interceptor para lidar com erros de resposta (ex: token expirado)
api.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response && error.response.status === 401) {
            // Se der erro 401 (Não autorizado/Token expirado)
            // ANTES: Limpava o token e forçava logout.
            // AGORA: Apenas rejeita o erro para que o frontend decida o que fazer (ex: mostrar aviso).
            // localStorage.removeItem('@App:token');
            // localStorage.removeItem('@App:user');
            
            console.warn("Autenticação falhou (401). Token pode estar expirado.");
        }
        return Promise.reject(error);
    }
);

export default api;
