package com.tesis.municipalidadbackendapp.usuariosinternos.controller;

import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("guardar_usuario")
    public UsuarioResponse guardarUsuario (@RequestBody UsuarioRequest usuarioRequest) {
        return usuarioService.guardarUsuario(usuarioRequest);
    }






}
