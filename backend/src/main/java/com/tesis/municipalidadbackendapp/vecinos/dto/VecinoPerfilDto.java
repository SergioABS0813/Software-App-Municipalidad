package com.tesis.municipalidadbackendapp.vecinos.dto;

public record VecinoPerfilDto(
        Integer id,
        String nombreCompleto,
        String dni,
        String correo,
        String celular,
        String fechaNacimiento,
        Boolean aceptaTratamientoDatos,
        String estado
) {
}
