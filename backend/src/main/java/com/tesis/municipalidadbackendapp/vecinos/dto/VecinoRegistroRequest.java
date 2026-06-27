package com.tesis.municipalidadbackendapp.vecinos.dto;

public record VecinoRegistroRequest(
        String dni,
        String nombreCompleto,
        String email,
        String celular,
        String fechaNacimiento,
        Boolean aceptaTratamientoDatos
) {
}
