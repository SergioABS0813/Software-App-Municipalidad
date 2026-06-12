import axios from 'axios';
import keycloak from "../../features/auth/keycloak";

// Dominio del backend
const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

// Coloca el JWT en el header Authorization ante cualquier consulta
api.interceptors.request.use((config) => {
    if (keycloak.token){
        config.headers.Authorization = `Bearer ${keycloak.token}`;
    }

    return config;
})

export default api;
