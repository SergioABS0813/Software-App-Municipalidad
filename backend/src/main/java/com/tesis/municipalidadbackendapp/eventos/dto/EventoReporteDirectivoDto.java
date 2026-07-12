package com.tesis.municipalidadbackendapp.eventos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventoReporteDirectivoDto(
        Integer id,
        String titulo,
        String categoriaNombre,
        String ubicacionNombre,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        LocalDateTime finalizadoEn,
        String estadoCodigo,
        Boolean requiereInscripcion,
        Boolean requiereControlAsistencia,
        Boolean encuestaSatisfaccionHabilitada,
        Integer totalInscritos,
        Integer totalAsistentes,
        Integer tasaAsistencia,
        Integer totalValidacionesQr,
        Integer totalValidacionesManual,
        Integer adopcionQr,
        Double promedioSatisfaccion,
        Integer totalValoraciones,
        Float costoReferencial,
        Boolean requierePago,
        Float costoVecinal,
        BigDecimal ingresosValidados,
        String instruccionesPago,
        Integer aforoMaximo,
        String metaTipo,
        Float metaValor
) {
}
