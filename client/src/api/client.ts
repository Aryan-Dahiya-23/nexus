import axios from 'axios';

const baseURL = import.meta.env.VITE_URL || 'http://localhost:4000';

export const apiClient = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for centralized error logging/formatting and session expiration handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

        // Log detailed API error in dev
        console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${requestUrl}:`, message);

        // Global 401 session expiration handler (skip initial auth check /auth/login/success to let ProtectedRoute handle it)
        if (status === 401 && !requestUrl.includes('/auth/login/success')) {
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
