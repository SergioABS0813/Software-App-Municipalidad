package com.tesis.municipalidadbackendapp.eventos.dto;

import java.time.LocalDateTime;
import java.util.List;

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
        Boolean ventanaOperativaActiva,
        Integer aforoMaximo,
        Integer registered,
        Integer totalValidated,
        Integer qrValidated,
        Integer manualValidated,
        List<ValidacionRecienteDto> recentValidations
) {
    public record ValidacionRecienteDto(
            Integer id,
            String code,
            String method,
            String origin,
            String person,
            String status,
            String time,
            String annulmentReason,
            String annulledAt
    ) {}
}
