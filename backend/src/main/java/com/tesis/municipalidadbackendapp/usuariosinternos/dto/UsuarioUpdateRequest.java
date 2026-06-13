package com.tesis.municipalidadbackendapp.usuariosinternos.dto;

public record UsuarioUpdateRequest(
        String email,
        Integer areaMunicipalId,
        Integer rolId
) {
}
