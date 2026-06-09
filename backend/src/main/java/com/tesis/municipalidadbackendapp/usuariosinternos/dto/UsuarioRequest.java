package com.tesis.municipalidadbackendapp.usuariosinternos.dto;

import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Rol;

public record UsuarioRequest (String nombre, String dni, String email, Integer areaMunicipalId, Integer rolId, String password) {
}
