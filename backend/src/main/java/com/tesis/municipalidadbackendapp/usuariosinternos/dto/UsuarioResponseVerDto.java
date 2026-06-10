package com.tesis.municipalidadbackendapp.usuariosinternos.dto;

public record UsuarioResponseVerDto (String dni,
                                     String nombre,
                                     Byte activo,
                                     String email,
                                     Integer areaMunicipalId,
                                     Integer rolId){
}
