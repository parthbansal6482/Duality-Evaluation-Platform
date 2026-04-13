import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const dualityApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add dualityToken
dualityApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('dualityToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors (no hard reload)
dualityApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Just clear token and let the component handle the redirect or show login
            localStorage.removeItem('dualityToken');
            localStorage.removeItem('dualityUser');
            // We don't do window.location.href = '/' here to avoid loops
        }
        return Promise.reject(error);
    }
);

export default dualityApi;
