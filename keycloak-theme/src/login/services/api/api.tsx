import axios from 'axios';

function resolveApiBaseUrl() {
    const configuredBaseUrl = import.meta.env.VITE_KC_API_BASE_URL
        ?? import.meta.env.VITE_API_BASE_URL
        ?? 'https://municipalidadsm.online/api';

    if (configuredBaseUrl !== '/api') {
        return configuredBaseUrl;
    }

    return configuredBaseUrl;
}

const api = axios.create({
    baseURL: resolveApiBaseUrl()
});

export default api;


