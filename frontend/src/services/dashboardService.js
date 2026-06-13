import api from './api/api';

// ADMIN
export async function getUsuariosInternos({ texto = '', page = 0, size = 10 } = {}){
    const response = await api.get("usuario/admin/obtener_usuarios_internos", {
        params: { texto, page, size },
    });
    return response.data;
}

export async function guardarUsuarioInterno(usuario){
    const response = await api.post("usuario/admin/guardar_usuario", usuario);
    return response.data;
}

export async function getRolesUsuariosInternos(){
    const response = await api.get("rol/admin/find_all");
    return response.data
}

export async function getCategoriasConfiguracion({ texto = '', page = 0 } = {}){
    const response = await api.get("categoria/admin/configuracion", {
        params: { texto, page },
    });
    return response.data
}

export async function getUbicacionesConfiguracion({ texto = '', page = 0 } = {}){
    const response = await api.get("ubicacion/admin/configuracion", {
        params: { texto, page },
    });
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

export async function buscarUsuariosInternos({ texto = '', page = 0, size = 10 } = {}){
    const response = await api.get("usuario/admin/buscar_usuarios_internos", {
        params: { texto, page, size },
    });
    return response.data
}

export async function guardarCategoria(categoria){
    const response = await api.post("categoria/admin/guardar_categoria", categoria);
    return response.data
}
