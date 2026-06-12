package com.tesis.municipalidadbackendapp.common;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioAutenticadoService {
    private final UsuarioService usuarioService;

    public Usuario obtenerUsuarioAutenticado() {
        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String keycloakId = jwt.getSubject();

        return usuarioService.obtenerPorKeycloakId(keycloakId);
    }
}
