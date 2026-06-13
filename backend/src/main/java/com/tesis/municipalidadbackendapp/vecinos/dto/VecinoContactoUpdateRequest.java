package com.tesis.municipalidadbackendapp.vecinos.dto;

public record VecinoContactoUpdateRequest(
        String correo,
        String celular
) {
}
