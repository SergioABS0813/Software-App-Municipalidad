import axios from 'axios';

// Dominio del backend
const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

export default api;
