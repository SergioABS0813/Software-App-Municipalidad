package com.tesis.municipalidadbackendapp.auth.dto;

public record AuthenticatedUserResponse(
        String keycloakId,
        String email,
        String rol,
        Integer vecinoId,
        String estadoVecino
) {
}
