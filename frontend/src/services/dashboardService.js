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

export async function buscarUsuariosInternos({ texto = '', page = 0, size = 10 } = {}){
    const response = await api.get("usuario/admin/buscar_usuarios_internos", {
        params: { texto, page, size },
    });
    return response.data
}

