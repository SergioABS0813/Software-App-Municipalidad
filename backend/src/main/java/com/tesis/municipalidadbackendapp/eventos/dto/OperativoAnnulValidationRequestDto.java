package com.tesis.municipalidadbackendapp.eventos.dto;

public record OperativoAnnulValidationRequestDto(
        String reason,
        String detail
) {}