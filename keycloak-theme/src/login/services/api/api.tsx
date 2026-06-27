import axios from 'axios';

function resolveApiBaseUrl() {
    const configuredBaseUrl = import.meta.env.VITE_KC_API_BASE_URL
        ?? import.meta.env.VITE_API_BASE_URL
        ?? 'http://localhost:8080/api';

    if (configuredBaseUrl !== '/api') {
        return configuredBaseUrl;
    }

    if (typeof window !== 'undefined' && window.location.port === '7000') {
        return 'http://localhost:8080/api';
    }

    return configuredBaseUrl;
}

const api = axios.create({
    baseURL: resolveApiBaseUrl()
});

export default api;
