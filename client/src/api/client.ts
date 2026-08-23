import axios from 'axios';

const baseURL = import.meta.env.VITE_URL || 'http://localhost:4000';

export const apiClient = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for centralized error logging/formatting
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
        console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
        return Promise.reject(error);
    }
);

export default apiClient;
