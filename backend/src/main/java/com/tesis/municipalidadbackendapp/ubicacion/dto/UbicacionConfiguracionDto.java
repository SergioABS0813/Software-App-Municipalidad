package com.tesis.municipalidadbackendapp.ubicacion.dto;

import java.math.BigDecimal;

public record UbicacionConfiguracionDto(
        Integer id,
        String nombre,
        String direccion,
        String referencia,
        BigDecimal latitud,
        BigDecimal longitud,
        Byte activo,
        Long eventosAsociados
) {
}
