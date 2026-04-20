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
    timeout: 60000,
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
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Se der erro 401 e não for uma tentativa de refresh anterior
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Se já estivermos a actualizar o token, colocamos este pedido na fila
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = sessionStorage.getItem('@App:refresh');
            
            if (refreshToken) {
                try {
                    // Tenta obter novo access token usando o refresh token
                    // Nota: Usamos axios directo para evitar o interceptor de request acima
                    const res = await axios.post(`${getServerIP()}auth/refresh/`, {
                        refresh: refreshToken
                    });

                    if (res.status === 200) {
                        const { access } = res.data;
                        sessionStorage.setItem('@App:token', access);
                        api.defaults.headers.Authorization = `Bearer ${access}`;
                        
                        processQueue(null, access);
                        
                        originalRequest.headers.Authorization = `Bearer ${access}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    
                    // Se o refresh token também falhou (ex: expirou), limpamos tudo
                    console.error("Refresh token expirado ou inválido.");
                    // Não limpamos aqui para evitar loops, o AuthContext cuidará disso
                    // ao receber o erro 401 final.
                } finally {
                    isRefreshing = false;
                }
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
