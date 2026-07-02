package com.tesis.municipalidadbackendapp.pago_inscripcion.dto;

public record PagoComprobanteResponseDto(
        Integer pagoId,
        Integer inscripcionId,
        String estadoPago,
        String estadoInscripcion,
        String comprobanteUrl,
        String observacion
) {
}