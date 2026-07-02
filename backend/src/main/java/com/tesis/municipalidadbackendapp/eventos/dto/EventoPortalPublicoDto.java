package com.tesis.municipalidadbackendapp.eventos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record EventoPortalPublicoDto(
        Integer id,
        String titulo,
        String descripcionBreve,
        String descripcion,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        Integer categoriaId,
        String categoriaNombre,
        String areaMunicipalNombre,
        Integer ubicacionId,
        String ubicacionNombre,
        String ubicacionDireccion,
        String ubicacionReferencia,
        BigDecimal latitud,
        BigDecimal longitud,
        Float costoReferencial,
        Boolean requierePago,
        Float costo,
        String instruccionesPago,
        Integer aforoMaximo,
        Byte edadMin,
        Byte edadMax,
        Boolean requiereInscripcion,
        Boolean requiereControlAsistencia,
        List<ItemOrdenadoPublicoDto> agenda,
        List<ItemOrdenadoPublicoDto> requisitos,
        List<RecursoPublicoDto> recursos
) {
    public record ItemOrdenadoPublicoDto(Integer orden, String descripcion) {}

    public record RecursoPublicoDto(
            Integer id,
            String tipoRecurso,
            String objectPath,
            String nombreOriginal,
            String mimeType,
            Long sizeBytes,
            String signedUrl
    ) {}
}
