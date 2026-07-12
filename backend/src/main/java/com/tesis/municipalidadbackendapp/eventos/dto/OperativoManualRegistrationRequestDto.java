package com.tesis.municipalidadbackendapp.eventos.dto;

public record OperativoManualRegistrationRequestDto(
        String dni,
        String names,
        String lastNames,
        String fullName,
        String phone,
        String email,
        Boolean aceptaTratamientoDatos
) {}