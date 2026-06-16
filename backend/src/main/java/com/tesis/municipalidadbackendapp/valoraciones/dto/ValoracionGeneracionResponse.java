package com.tesis.municipalidadbackendapp.valoraciones.dto;

public record ValoracionGeneracionResponse(
        Integer eventoId,
        int valoracionesGeneradas,
        int correosIntentados
) {
}
