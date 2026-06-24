package com.tesis.municipalidadbackendapp.eventos.dto;

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
        Integer aforoMaximo,
        String metaTipo,
        Float metaValor
) {
}
