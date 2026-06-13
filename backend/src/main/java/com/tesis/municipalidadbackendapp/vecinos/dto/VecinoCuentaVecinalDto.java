package com.tesis.municipalidadbackendapp.vecinos.dto;

public record VecinoCuentaVecinalDto(
        Integer id,
        String nombreCompleto,
        String dni,
        String correo,
        String estado
) {
}
