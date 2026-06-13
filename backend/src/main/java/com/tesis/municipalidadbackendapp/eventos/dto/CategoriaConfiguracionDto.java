package com.tesis.municipalidadbackendapp.eventos.dto;

public record CategoriaConfiguracionDto(
        Integer id,
        String nombre,
        Long eventosAsociados
) {
}
