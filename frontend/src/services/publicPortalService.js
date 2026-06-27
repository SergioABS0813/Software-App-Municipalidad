import api from './api/api';

// Recuperar contraseÃ±a
export async function recuperarContrasena(correo, dni){
    const response = await api.post('auth/forgot-password', {
        correo,
        dni
    });
    return response.data;
}
export async function obtenerEventosPublicados({ texto = '', categoriaId = '', page = 0, size = 6 } = {}){
    const response = await api.get('public/eventos', {
        params: {
            texto: texto || undefined,
            categoriaId: categoriaId || undefined,
            page,
            size,
        },
    });
    return response.data;
}
export async function obtenerProximoEventoPublicado(){
    const response = await api.get('public/eventos/proximo');
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
export async function obtenerInscripcionActualEvento(eventoId){
    const response = await api.get(`inscripciones/eventos/${eventoId}/actual`);
    return response.data;
}
export async function cancelarInscripcionEvento(eventoId){
    const response = await api.patch(`inscripciones/eventos/${eventoId}/cancelar`);
    return response.data;
}
export async function obtenerQrActivoInscripcion(inscripcionId){
    const response = await api.get(`qr/vecino/inscripcion/${inscripcionId}`);
    return response.data;
}
export async function confirmarSesionActual(){
    const response = await api.get('auth/me');
    return response.data;
}
export async function obtenerPerfilVecino(){
    const response = await api.get('vecino/perfil');
    return response.data;
}
export async function actualizarPerfilVecino(perfil){
    const response = await api.put('vecino/perfil', perfil);
    return response.data;
}