import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Interceptor para adicionar o token JWT
api.interceptors.request.use(
    async config => {
        const token = localStorage.getItem('@App:token');
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
            // Se der erro 401 (Não autorizado), limpa o token e redireciona
            localStorage.removeItem('@App:token');
            localStorage.removeItem('@App:user');
            // Opcional: Redirecionar para login ou lidar com isso no contexto
        }
        return Promise.reject(error);
    }
);

export default api;
