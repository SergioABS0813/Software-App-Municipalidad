import api from './api/api';

export async function obtenerValoracion(token) {
  const response = await api.get(`valoraciones/${encodeURIComponent(token)}`);
  return response.data;
}

export async function enviarValoracion({ token, puntuacion }) {
  const response = await api.post(`valoraciones/${encodeURIComponent(token)}/responder`, {
    puntuacion,
  });

  return response.data;
}

export async function validarTokenValoracion(token) {
  return obtenerValoracion(token);
}