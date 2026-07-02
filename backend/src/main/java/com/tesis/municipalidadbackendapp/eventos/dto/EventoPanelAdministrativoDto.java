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
        Boolean requierePago,
        Float costoVecinal,
        String instruccionesPago,
        Integer aforoMaximo,
        Integer cuposDisponibles,
        Byte edadMin,
        Byte edadMax,
        Boolean requiereInscripcion,
        Boolean requiereControlAsistencia,
        LocalDateTime actualizadoEn,
        String motivoCancelacion,
        LocalDateTime fechaCancelacion,
        Integer usuarioCancelacionId,
        Integer completitud,
        List<AlertaFichaEventoPanelAdministrativoDto> alertas,
        List<CriterioFichaEventoPanelAdministrativoDto> criteriosFicha,
        List<ItemOrdenadoEventoPanelAdministrativoDto> agenda,
        List<ItemOrdenadoEventoPanelAdministrativoDto> requisitos,
        List<RecursoEventoPanelAdministrativoDto> recursos,
        List<UsuarioOperativoDto> operativosAsignados,
        ObservacionDirectivaPanelAdministrativoDto ultimaObservacionDirectiva
) {
    public record AlertaFichaEventoPanelAdministrativoDto(String tipo, String mensaje) {}
    public record ObservacionDirectivaPanelAdministrativoDto(Integer id, String observacion, String estado, LocalDateTime fechaObservacion, String usuarioNombre) {}
    public record CriterioFichaEventoPanelAdministrativoDto(
            String codigo,
            String nombre,
            Boolean completo,
            Boolean requerido,
            String estadoTexto
    ) {}
    public record CategoriaEventoPanelAdministrativoDto(Integer id, String nombre) {}
    public record ItemOrdenadoEventoPanelAdministrativoDto(Integer orden, String descripcion) {}
    public record RecursoEventoPanelAdministrativoDto(Integer id, String tipoRecurso, String objectPath, String nombreOriginal, String mimeType, Long sizeBytes, String signedUrl) {}
}
