package com.tesis.municipalidadbackendapp.eventos.dto;

public record OperativoQrValidationResponseDto(
        String status,
        String title,
        String message,
        String tone,
        String citizenName,
        String code,
        EventoOperativoHoyDto.ValidacionRecienteDto validation
) {}