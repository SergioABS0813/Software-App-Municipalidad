package com.tesis.municipalidadbackendapp.pago_inscripcion.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PagoInscripcionResumenDto(
        Integer id,
        Integer inscripcionId,
        String estadoPago,
        BigDecimal monto,
        String medioPago,
        String numeroOperacion,
        LocalDate fechaPago,
        Instant fechaRegistro,
        String comprobanteUrl,
        Integer eventoId,
        String eventoTitulo,
        Integer vecinoId,
        String vecinoNombre,
        String vecinoDni,
        String estadoInscripcion
) {
}