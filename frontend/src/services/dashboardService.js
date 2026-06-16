import api from './api/api';

// ADMIN
export async function getUsuariosInternos({ texto = '', rolId = '', page = 0, size = 10 } = {}){
    const response = await api.get("usuario/admin/obtener_usuarios_internos", {
        params: { texto, rolId: rolId || undefined, page, size },
    });
    return response.data;
}

export async function getUsuarioInternoDetalle(id){
    const response = await api.get(`usuario/admin/obtener_usuario_interno/${id}`);
    return response.data;
}

export async function guardarUsuarioInterno(usuario){
    const response = await api.post("usuario/admin/guardar_usuario", usuario);
    return response.data;
}

export async function actualizarUsuarioInterno(id, usuario){
    const response = await api.put(`usuario/admin/${id}`, usuario);
    return response.data;
}

export async function actualizarEstadoUsuarioInterno(id, estado){
    const response = await api.patch(`usuario/admin/${id}/estado`, { estado });
    return response.data;
}

export async function getRolesUsuariosInternos(){
    const response = await api.get("rol/admin/find_all");
    return response.data
}

export async function getCuentasVecinales({ texto = '', estado = '', page = 0 } = {}){
    const response = await api.get("vecino/admin/cuentas_vecinales", {
        params: { texto, estado: estado || undefined, page },
    });
    return response.data
}

export async function getCuentaVecinalDetalle(id){
    const response = await api.get(`vecino/admin/cuentas_vecinales/${id}`);
    console.log(response.data)
    return response.data
}

export async function actualizarContactoCuentaVecinal(id, contacto){
    const response = await api.put(`vecino/admin/cuentas_vecinales/${id}/contacto`, contacto);
    return response.data
}

export async function getCategoriasConfiguracion({ texto = '', page = 0, size } = {}){
    const response = await api.get("categoria/admin/configuracion", {
        params: { texto, page, size },
    });
    return response.data
}

export async function getUbicacionesConfiguracion({ texto = '', page = 0, size } = {}){
    const response = await api.get("ubicacion/admin/configuracion", {
        params: { texto, page, size },
    });
    return response.data
}

export async function getEventosGestion({
    texto = '',
    estado = '',
    categoriaId = '',
    sinCategoria = false,
    page = 0,
    size = 5,
} = {}){
    const response = await api.get("eventos/admin/operacion", {
        params: {
            texto,
            estado: estado || undefined,
            categoriaId: categoriaId || undefined,
            sinCategoria,
            page,
            size,
        },
    });
    return response.data
}

export async function getEstadosEventoGestion(){
    const response = await api.get("estado_evento/admin/operacion");
    return response.data
}

export async function guardarEventoGestion(evento){
    const response = await api.post("eventos/admin/operacion", evento);
    return response.data
}

export async function actualizarEventoGestion(id, evento){
    const response = await api.put(`eventos/admin/operacion/${id}`, evento);
    return response.data
}

export async function eliminarEventoGestion(id){
    const response = await api.delete(`eventos/admin/operacion/${id}`);
    return response.data
}

export async function guardarUbicacionConfiguracion(ubicacion){
    const response = await api.post("ubicacion/admin/guardar_ubicacion", ubicacion);
    return response.data
}

export async function actualizarEstadoUbicacionConfiguracion(id, estado){
    const response = await api.patch(`ubicacion/admin/${id}/estado`, { estado });
    return response.data
}

export async function eliminarUbicacionConfiguracion(id){
    const response = await api.delete(`ubicacion/admin/${id}`);
    return response.data
}

export async function buscarUsuariosInternos({ texto = '', rolId = '', page = 0, size = 10 } = {}){
    const response = await api.get("usuario/admin/buscar_usuarios_internos", {
        params: { texto, rolId: rolId || undefined, page, size },
    });
    return response.data
}

export async function guardarCategoria(categoria){
    const response = await api.post("categoria/admin/guardar_categoria", categoria);
    return response.data
}

export async function eliminarCategoriaConfiguracion(id){
    const response = await api.delete(`categoria/admin/${id}`);
    return response.data
}

export async function getNotificacionesAdministrador({ soloNoLeidas = false } = {}){
    const endpoint = soloNoLeidas ? "notificacion/no_leidas" : "notificacion/todas";
    const response = await api.get(endpoint);
    return response.data;
}

export async function marcarNotificacionComoLeida(id){
    const response = await api.patch(`notificacion/${id}/leer`);
    return response.data;
}
