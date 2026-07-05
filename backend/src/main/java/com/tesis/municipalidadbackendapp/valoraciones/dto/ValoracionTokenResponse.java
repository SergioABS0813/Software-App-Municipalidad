package com.tesis.municipalidadbackendapp.valoraciones.dto;

import java.time.LocalDateTime;

public record ValoracionTokenResponse(
        Integer eventoId,
        String eventoTitulo,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        String estadoValoracion,
        boolean yaRespondida,
        boolean expirada
) {
}