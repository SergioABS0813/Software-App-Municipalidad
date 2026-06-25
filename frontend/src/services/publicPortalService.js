import api from './api/api';

// Recuperar contraseña
export async function recuperarContrasena(correo, dni){
    const response = await api.post('auth/forgot-password', {
        correo,
        dni
    });
    return response.data;
}
export async function obtenerEventosPublicados({ texto = '', categoriaId = '' } = {}){
    const response = await api.get('public/eventos', {
        params: {
            texto: texto || undefined,
            categoriaId: categoriaId || undefined,
        },
    });
    return response.data;
}

export async function obtenerCategoriasPublicas(){
    const response = await api.get('public/categorias');
    return response.data;
}
export async function inscribirEventoPublicado(eventoId){
    const response = await api.post(`inscripciones/eventos/${eventoId}`);
    return response.data;
}