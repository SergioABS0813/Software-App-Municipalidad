package com.tesis.municipalidadbackendapp.vecinos.dto;

public record VecinoPerfilUpdateRequest(
        String dni,
        String nombreCompleto,
        String correo,
        String celular,
        String fechaNacimiento,
        Boolean aceptaTratamientoDatos
) {
}
