import axios, { type InternalAxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true, // Important for Laravel Sanctum/sessions
    timeout: 10000, // 10 seconds timeout
});

axiosInstance.interceptors.request.use(
    (config) => {
        // Only add CSRF token for non-GET requests
        if (config.method?.toUpperCase() !== 'GET') {
            const token = getCSRFToken();
            if (token) {
                config.headers['X-CSRF-TOKEN'] = token;
                
                // For form data, also add _token parameter
                if (config.data instanceof FormData) {
                    config.data.append('_token', token);
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle CSRF token mismatch specifically
        if (error.response?.status === 419 && error.config) {
            console.error('CSRF token mismatch. Refreshing token...');
            // Optionally: refresh CSRF token and retry
            return refreshCSRFTokenAndRetry(error.config);
        }
        return Promise.reject(error);
    }
);

function getCSRFToken(): string | null {
    if (typeof document !== 'undefined') {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
    }
    return null;
}

async function refreshCSRFTokenAndRetry(originalRequest: InternalAxiosRequestConfig) {
    try {
        // Fetch new CSRF token from Laravel
        await axios.get('/sanctum/csrf-cookie');
        
        // Update the meta tag with new token if needed
        const newToken = getCSRFToken();
        if (newToken && originalRequest.headers) {
            originalRequest.headers['X-CSRF-TOKEN'] = newToken;
        }
        
        // Retry the original request
        return axiosInstance(originalRequest);
    } catch (error) {
        return Promise.reject(error);
    }
}

export default axiosInstance;
