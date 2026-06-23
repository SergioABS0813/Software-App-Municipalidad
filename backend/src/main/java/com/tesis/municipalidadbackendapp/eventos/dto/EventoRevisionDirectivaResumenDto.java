package com.tesis.municipalidadbackendapp.eventos.dto;

import java.time.LocalDateTime;

public record EventoRevisionDirectivaResumenDto(
        Integer id,
        String titulo,
        String estadoCodigo,
        String categoriaNombre,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        String ubicacionNombre,
        LocalDateTime actualizadoEn
) {}
