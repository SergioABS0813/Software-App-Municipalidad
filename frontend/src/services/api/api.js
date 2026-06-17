import axios from 'axios';
import keycloak from "../../features/auth/keycloak";

export const SESSION_EXPIRED_MESSAGE = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';

// Dominio del backend
const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

function notifySessionExpired() {
    window.dispatchEvent(new CustomEvent('app-session-expired', {
        detail: { message: SESSION_EXPIRED_MESSAGE },
    }));
}

function setAuthorizationHeader(config) {
    if (!keycloak.token) {
        return config;
    }

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${keycloak.token}`;

    return config;
}

function rejectWithSessionExpired(error) {
    notifySessionExpired();

    if (error?.response) {
        error.response.data = {
            ...(error.response.data ?? {}),
            message: SESSION_EXPIRED_MESSAGE,
        };
    }

    error.sessionExpired = true;
    return Promise.reject(error);
}

async function redirectToKeycloakLogin() {
    try {
        keycloak.clearToken?.();
        await keycloak.login({
            redirectUri: window.location.href,
            locale: 'es',
        });
    } catch (loginError) {
        console.error('No se pudo redirigir al login de Keycloak.', loginError);
    }
}

async function refreshToken(minValidity) {
    if (!keycloak.authenticated) {
        return false;
    }

    await keycloak.updateToken(minValidity);
    return Boolean(keycloak.token);
}

export function getApiErrorMessage(error, fallbackMessage = 'No se pudo completar la operación.') {
    const status = error?.response?.status;

    if (status === 401 || error?.sessionExpired) {
        return SESSION_EXPIRED_MESSAGE;
    }

    if (status === 403) {
        return 'No tienes permisos para realizar esta acción.';
    }

    if (status === 400) {
        return error.response?.data?.message ?? 'Datos inválidos o ficha incompleta.';
    }

    if (status >= 500) {
        return 'Ocurrió un error interno. Inténtalo nuevamente.';
    }

    return error?.response?.data?.message ?? fallbackMessage;
}

// Renueva el token antes de cada request autenticada y adjunta siempre el JWT vigente.
api.interceptors.request.use(async (config) => {
    if (!keycloak.authenticated) {
        return config;
    }

    try {
        await refreshToken(30);
        return setAuthorizationHeader(config);
    } catch (error) {
        await redirectToKeycloakLogin();
        return Promise.reject(error);
    }
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || !originalRequest || originalRequest._retryAfterTokenRefresh) {
            if (error.response?.status === 401) {
                return rejectWithSessionExpired(error);
            }

            return Promise.reject(error);
        }

        originalRequest._retryAfterTokenRefresh = true;

        try {
            await refreshToken(-1);
            return api(setAuthorizationHeader(originalRequest));
        } catch (refreshError) {
            await redirectToKeycloakLogin();
            return rejectWithSessionExpired(error);
        }
    },
);

export default api;
