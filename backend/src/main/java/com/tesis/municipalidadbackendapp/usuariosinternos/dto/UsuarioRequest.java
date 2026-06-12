package com.tesis.municipalidadbackendapp.usuariosinternos.dto;

public record UsuarioRequest (String dni, String nombre, String email, Integer areaMunicipalId, Integer rolId) {
}
