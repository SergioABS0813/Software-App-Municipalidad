package com.tesis.municipalidadbackendapp.config;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final List<String> ROLES_APLICACION = List.of("ADMINISTRADOR", "DIRECTIVO", "OPERATIVO", "VECINO");

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<String> roles = new LinkedHashSet<>();
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");

        if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> rolesClaim) {
            rolesClaim.stream()
                    .map(String::valueOf)
                    .map(this::normalizarRol)
                    .filter(rol -> !rol.isBlank())
                    .forEach(roles::add);
        }

        buscarUsuarioInterno(jwt)
                .map(this::obtenerRolInterno)
                .filter(rol -> !rol.isBlank())
                .ifPresent(roles::add);

        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }

    private Optional<Usuario> buscarUsuarioInterno(Jwt jwt) {
        String keycloakId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");

        return usuarioRepository.findByKeycloakId(keycloakId)
                .or(() -> StringUtils.hasText(email)
                        ? usuarioRepository.findByEmailIgnoreCase(email.trim())
                        : Optional.empty());
    }

    private String obtenerRolInterno(Usuario usuario) {
        if (usuario.getRol() == null) {
            return "";
        }

        return List.of(usuario.getRol().getCodigo(), usuario.getRol().getNombre())
                .stream()
                .map(this::normalizarRol)
                .filter(rol -> ROLES_APLICACION.contains(rol))
                .findFirst()
                .orElse("");
    }

    private String normalizarRol(String rol) {
        if (rol == null) {
            return "";
        }

        String normalizado = rol.trim().toUpperCase();
        return normalizado.startsWith("ROLE_") ? normalizado.substring(5) : normalizado;
    }
}