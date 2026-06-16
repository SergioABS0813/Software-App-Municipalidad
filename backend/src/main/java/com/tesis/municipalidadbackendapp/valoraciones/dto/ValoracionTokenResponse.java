package com.tesis.municipalidadbackendapp.valoraciones.dto;

import java.time.LocalDateTime;

public record ValoracionTokenResponse(
        Integer eventoId,
        String tituloEvento,
        LocalDateTime fechaEvento,
        String estado
) {
}
