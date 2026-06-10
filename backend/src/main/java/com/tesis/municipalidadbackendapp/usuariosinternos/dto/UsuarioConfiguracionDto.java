package com.tesis.municipalidadbackendapp.usuariosinternos.dto;

public record UsuarioConfiguracionDto (Integer id,
                                       String nombre,
                                       String email,
                                       RolConfiguracionDto rolConfiguracionDto,
                                       Byte activo) {
}
