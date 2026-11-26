import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
    withCredentials: true,
    timeout: 10000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        if (config.method?.toUpperCase() !== 'GET') {
            const token = getCSRFToken();
            if (token) {
                config.headers['X-CSRF-TOKEN'] = token;

                if (config.data instanceof FormData) {
                    config.data.append('_token', token);
                }
            }
        }
        return config;
    },
    (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // FIX 2: Handle 419 gracefully without calling non-existent Sanctum routes.
        if (error.response?.status === 419) {
            console.warn(
                'Session expired. Reloading page to fetch new CSRF token...',
            );
            // A hard reload is the safest way to get a fresh token in a standard Laravel app.
            window.location.reload();
        }
        return Promise.reject(error);
    },
);

function getCSRFToken(): string | null {
    if (typeof document !== 'undefined') {
        return (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || null
        );
    }
    return null;
}

export default axiosInstance;
