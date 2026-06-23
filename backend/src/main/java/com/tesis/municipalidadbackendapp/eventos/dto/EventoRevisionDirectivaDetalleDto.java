package com.tesis.municipalidadbackendapp.eventos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record EventoRevisionDirectivaDetalleDto(
        Integer id,
        String titulo,
        String descripcionBreve,
        String descripcion,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        String estadoCodigo,
        String categoriaNombre,
        String areaMunicipalNombre,
        Float costoReferencial,
        Integer aforoMaximo,
        Byte edadMin,
        Byte edadMax,
        Boolean requiereControlAsistencia,
        LocalDateTime actualizadoEn,
        UbicacionDetalleDto ubicacion,
        List<EventoPanelAdministrativoDto.ItemOrdenadoEventoPanelAdministrativoDto> agenda,
        List<EventoPanelAdministrativoDto.ItemOrdenadoEventoPanelAdministrativoDto> requisitos,
        List<EventoPanelAdministrativoDto.RecursoEventoPanelAdministrativoDto> recursos,
        List<UsuarioOperativoDto> operativosAsignados,
        ObservacionDetalleDto ultimaObservacion
) {
    public record UbicacionDetalleDto(
            Integer id,
            String nombre,
            String direccion,
            String referencia,
            BigDecimal latitud,
            BigDecimal longitud
    ) {}

    public record ObservacionDetalleDto(
            Integer id,
            String observacion,
            String estado,
            LocalDateTime fechaObservacion,
            String usuarioNombre
    ) {}
}
