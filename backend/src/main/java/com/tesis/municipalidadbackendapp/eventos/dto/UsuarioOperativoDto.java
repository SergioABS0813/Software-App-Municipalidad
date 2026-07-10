package com.tesis.municipalidadbackendapp.eventos.dto;

public record UsuarioOperativoDto(
        Integer usuarioId,
        String nombres,
        String apellidos,
        String dni,
        String email,
        String rolNombre,
        Boolean asignable
) {}