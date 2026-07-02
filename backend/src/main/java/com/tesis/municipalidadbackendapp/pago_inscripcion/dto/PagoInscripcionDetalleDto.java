package com.tesis.municipalidadbackendapp.pago_inscripcion.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PagoInscripcionDetalleDto(
        Integer id,
        Integer inscripcionId,
        String estadoPago,
        BigDecimal monto,
        String medioPago,
        String numeroOperacion,
        LocalDate fechaPago,
        String comprobanteUrl,
        String observacion,
        Instant fechaRegistro,
        Instant fechaValidacion,
        Integer validadoPorUsuarioId,
        String validadoPorUsuarioNombre,
        Integer eventoId,
        String eventoTitulo,
        Integer aforoMaximo,
        Integer cuposDisponibles,
        Integer vecinoId,
        String vecinoNombre,
        String vecinoDni,
        String vecinoEmail,
        String estadoInscripcion,
        String motivoCancelacion,
        String observacionCancelacion
) {
}