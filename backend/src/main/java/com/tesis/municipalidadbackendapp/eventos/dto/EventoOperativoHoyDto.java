package com.tesis.municipalidadbackendapp.eventos.dto;

import java.time.LocalDateTime;

public record EventoOperativoHoyDto(
        Integer id,
        String title,
        String descripcionBreve,
        String description,
        LocalDateTime eventStartAt,
        LocalDateTime eventEndAt,
        String date,
        String time,
        String venue,
        String state,
        Integer aforoMaximo,
        Integer registered,
        Integer totalValidated,
        Integer qrValidated,
        Integer manualValidated
) {}
