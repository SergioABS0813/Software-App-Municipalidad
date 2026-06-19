package com.tesis.municipalidadbackendapp.eventos.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EventoPanelAdministrativoDto(
        Integer id,
        String titulo,
        String descripcionBreve,
        String descripcion,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        Integer ubicacionId,
        String ubicacionNombre,
        String estadoCodigo,
        Integer areaMunicipalId,
        String areaMunicipalNombre,
        CategoriaEventoPanelAdministrativoDto categoria,
        Float costoReferencial,
        Integer aforoMaximo,
        Byte edadMin,
        Byte edadMax,
        Boolean requiereControlAsistencia,
        LocalDateTime actualizadoEn,
        Integer completitud,
        List<AlertaFichaEventoPanelAdministrativoDto> alertas,
        List<CriterioFichaEventoPanelAdministrativoDto> criteriosFicha,
        List<ItemOrdenadoEventoPanelAdministrativoDto> agenda,
        List<ItemOrdenadoEventoPanelAdministrativoDto> requisitos,
        List<RecursoEventoPanelAdministrativoDto> recursos,
        List<UsuarioOperativoDto> operativosAsignados
) {
    public record AlertaFichaEventoPanelAdministrativoDto(String tipo, String mensaje) {}
    public record CriterioFichaEventoPanelAdministrativoDto(
            String codigo,
            String nombre,
            Boolean completo,
            Boolean requerido,
            String estadoTexto
    ) {}
    public record CategoriaEventoPanelAdministrativoDto(Integer id, String nombre) {}
    public record ItemOrdenadoEventoPanelAdministrativoDto(Integer orden, String descripcion) {}
    public record RecursoEventoPanelAdministrativoDto(String tipoRecurso, String urlRecurso, String nombreArchivo) {}
}
