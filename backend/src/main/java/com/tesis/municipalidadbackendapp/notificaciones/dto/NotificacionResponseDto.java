package com.tesis.municipalidadbackendapp.notificaciones.dto;

import java.time.Instant;

public record NotificacionResponseDto(
        Integer id,
        String titulo,
        String mensaje,
        String tipo,
        Boolean leida,
        String urlDestino,
        Instant fechaCreacion
) {
}
