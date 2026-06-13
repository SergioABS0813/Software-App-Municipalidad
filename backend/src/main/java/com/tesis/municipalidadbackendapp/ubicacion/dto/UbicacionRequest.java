package com.tesis.municipalidadbackendapp.ubicacion.dto;

import java.math.BigDecimal;

public record UbicacionRequest(
        String nombre,
        String direccion,
        String referencia,
        BigDecimal latitud,
        BigDecimal longitud,
        String estado
) {
}
