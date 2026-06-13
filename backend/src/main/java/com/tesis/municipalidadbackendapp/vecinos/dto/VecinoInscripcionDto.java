package com.tesis.municipalidadbackendapp.vecinos.dto;

public record VecinoInscripcionDto(
        Integer id,
        String evento,
        String fechaEvento,
        String codigoInscripcion,
        String estadoInscripcion,
        String asistencia
) {
}
