import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1/',
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
