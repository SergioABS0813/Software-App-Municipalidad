package com.tesis.municipalidadbackendapp.inscripciones.dto;

import java.time.Instant;

public record InscripcionEventoResponse(
        Integer id,
        Integer eventoId,
        String eventoTitulo,
        Integer vecinoId,
        String vecinoNombre,
        String codigoInscripcion,
        Instant fechaInscripcion,
        String estado,
        Integer pagoId,
        String estadoPago,
        String observacionPago,
        String comprobanteUrl,
        String motivoCancelacion,
        String observacionCancelacion
) {
}