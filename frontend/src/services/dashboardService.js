import api from './api/api';

// ADMIN
export async function getUsuariosInternos({ texto = '', rolId = '', page = 0, size = 10 } = {}){
    const response = await api.get("usuario/admin/obtener_usuarios_internos", {
        params: { texto, rolId: rolId || undefined, page, size },
    });
    return response.data;
}

export async function getOperativosActivos(){
    const response = await api.get("usuario/admin/operativos");
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

export async function enviarEnlaceRestablecimientoUsuario({ correo, dni }){
    const response = await api.post("auth/forgot-password", { correo, dni });
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
    ordenFechaInicio = '',
    page = 0,
    size = 5,
} = {}){
    const response = await api.get("eventos/admin/operacion", {
        params: {
            texto,
            estado: estado || undefined,
            categoriaId: categoriaId || undefined,
            sinCategoria,
            ordenFechaInicio: ordenFechaInicio || undefined,
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

export async function getEventosActivosDesdeHoyCard(){
    const response = await api.get("eventos/admin/card/activos_desde_hoy");
    return response.data
}

export async function getEventosBorradoresCard(){
    const response = await api.get("eventos/admin/card/borradores");
    return response.data
}

export async function getEventosParaRevisionCard(){
    const response = await api.get("eventos/admin/card/para_revision");
    return response.data
}

export async function getEventosObservadosCard(){
    const response = await api.get("eventos/admin/card/observados");
    return response.data
}

export async function guardarEventoGestion(evento){
    const response = await api.post("eventos/admin/operacion", evento);
    return response.data
}

export async function subirRecursoEvento(eventoId, tipoRecurso, archivo){
    const formData = new FormData();
    formData.append("tipoRecurso", tipoRecurso);
    formData.append("archivo", archivo);

    const response = await api.post(`eventos/admin/operacion/${eventoId}/recursos`, formData);
    return response.data;
}
export async function getRecursosEvento(eventoId){
    const response = await api.get(`eventos/${eventoId}/recursos`);
    return response.data;
}

export async function eliminarRecursoEvento(eventoId, recursoId){
    const response = await api.delete(`eventos/admin/operacion/${eventoId}/recursos/${recursoId}`);
    return response.data;
}

export async function actualizarEventoGestion(id, evento){
    const response = await api.put(`eventos/admin/operacion/${id}`, evento);
    return response.data
}

export async function eliminarEventoGestion(id){
    const response = await api.delete(`eventos/admin/operacion/${id}`);
    return response.data
}

export async function cancelarEventoGestion(id, { motivo = '' } = {}){
    const response = await api.patch(`eventos/admin/operacion/${id}/cancelar`, { motivo });
    return response.data
}

export async function getPagosInscripcionPendientes(filters = {}){
    const params = new URLSearchParams();
    if (filters.estado) params.set('estado', filters.estado);
    if (filters.busqueda) params.set('busqueda', filters.busqueda);
    if (filters.orden) params.set('orden', filters.orden);
    const queryString = params.toString();
    const response = await api.get(`admin/pagos-inscripcion${queryString ? `?${queryString}` : ''}`);
    return response.data;
}

export async function getPagoInscripcionDetalle(id){
    const response = await api.get(`admin/pagos-inscripcion/${id}`);
    return response.data;
}

export async function validarPagoInscripcion(id){
    const response = await api.post(`admin/pagos-inscripcion/${id}/validar`);
    return response.data;
}

export async function observarPagoInscripcion(id, observacion){
    const response = await api.post(`admin/pagos-inscripcion/${id}/observar`, { observacion });
    return response.data;
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

export async function getNotificacionesDirectivo({ soloNoLeidas = false } = {}){
    const endpoint = soloNoLeidas ? "notificacion/no_leidas" : "notificacion/todas";
    const response = await api.get(endpoint);
    return response.data;
}

export async function marcarNotificacionComoLeida(id){
    const response = await api.patch(`notificacion/${id}/leer`);
    return response.data;
}

export async function getEventosOperativoHoy(){
    const response = await api.get("operativo/eventos/hoy");
    return response.data;
}

export async function validarQrOperativoTexto(eventoId, qrContent){
    const response = await api.post(`operativo/eventos/${eventoId}/validaciones/qr/texto`, { qrContent });
    return response.data;
}

export async function validarQrOperativoImagen(eventoId, archivo){
    const formData = new FormData();
    formData.append("archivo", archivo);
    const response = await api.post(`operativo/eventos/${eventoId}/validaciones/qr/imagen`, formData);
    return response.data;
}

export async function validarAsistenciaManualOperativo(eventoId, payload){
    const response = await api.post(`operativo/eventos/${eventoId}/validaciones/manual`, payload);
    return response.data;
}


export async function anularAsistenciaOperativo(eventoId, asistenciaId, payload){
    const response = await api.post(`operativo/eventos/${eventoId}/validaciones/${asistenciaId}/anular`, payload);
    return response.data;
}

export async function consultarIdentidadInscripcionManualOperativo(dni){
    const response = await api.get(`operativo/eventos/inscripciones/manual/identidad/${dni}`);
    return response.data;
}
export async function registrarInscripcionManualOperativo(eventoId, payload){
    const response = await api.post(`operativo/eventos/${eventoId}/inscripciones/manual`, payload);
    return response.data;
}

export async function getReportesDirectivosFinalizados(){
    const response = await api.get("eventos/directivo/reportes");
    return response.data;
}

export async function getReporteDirectivoFinalizado(id){
    const response = await api.get(`eventos/directivo/reportes/${id}`);
    return response.data;
}
export async function getResumenCardsDirectivo(){
    const response = await api.get("eventos/directivo/cards");
    return response.data;
}

export async function getEventosRevisionDirectiva({ estado = 'TODOS', page = 0 } = {}){
    const response = await api.get("eventos/directivo/revision", {
        params: { estado, page },
    });
    return response.data;
}

export async function getConteosRevisionDirectiva(){
    const response = await api.get("eventos/directivo/revision/conteos");
    return response.data;
}

export async function getDetalleRevisionDirectiva(id){
    const response = await api.get(`eventos/directivo/revision/${id}`);
    return response.data;
}

export async function getHistorialEvento(eventoId){
    const response = await api.get(`eventos/${eventoId}/historial`);
    return response.data;
}

export async function aprobarEventoDirectivo(id){
    const response = await api.patch(`eventos/directivo/operacion/${id}/aprobar`);
    return response.data;
}

export async function observarEventoDirectivo(id, { observacion = '' } = {}){
    const response = await api.patch(`eventos/directivo/operacion/${id}/observar`, { observacion });
    return response.data;
}

export async function cancelarEventoDirectivo(id, { motivo = '' } = {}){
    const response = await api.patch(`eventos/directivo/operacion/${id}/cancelar`, { motivo });
    return response.data;
}

export async function consultaDni(dni){
    const response = await api.get(`consulta_dni/${dni}`);
    return response.data;
}
