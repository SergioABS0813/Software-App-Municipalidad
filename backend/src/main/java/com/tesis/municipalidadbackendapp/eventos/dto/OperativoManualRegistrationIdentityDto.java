package com.tesis.municipalidadbackendapp.eventos.dto;

public record OperativoManualRegistrationIdentityDto(
        String dni,
        String names,
        String lastNames,
        String fullName,
        boolean existingNeighbor,
        boolean registeredPlatform
) {}
