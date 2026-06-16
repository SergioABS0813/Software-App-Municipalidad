import api from './api/api';

export async function validarTokenValoracion(token) {
  const response = await api.get('valoraciones/validar', {
    params: { token },
  });

  return response.data;
}

export async function enviarValoracion({ token, puntuacion }) {
  const response = await api.post('valoraciones/responder', {
    token,
    puntuacion,
  });

  return response.data;
}
