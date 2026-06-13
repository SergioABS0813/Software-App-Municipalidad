package com.tesis.municipalidadbackendapp.vecinos.dto;

import java.util.List;

public record VecinoDetalleDto(
        Integer id,
        String nombreCompleto,
        String dni,
        String correo,
        String celular,
        String fechaNacimiento,
        String fechaRegistro,
        String estado,
        List<VecinoInscripcionDto> inscripciones
) {
}
