package com.tesis.municipalidadbackendapp.auth.controller;

import com.tesis.municipalidadbackendapp.auth.dto.AuthenticatedUserResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoIdentidadRegistroResponse;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoRegistroRequest;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoRegistroResponse;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/auth")
public class AuthUserController {

    private final VecinoService vecinoService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("vecinos/registro/identidad/{dni}")
    public VecinoIdentidadRegistroResponse consultarIdentidadRegistroVecino(@PathVariable String dni) {
        return vecinoService.consultarIdentidadRegistroVecino(dni);
    }

    @PostMapping("vecinos/registro")
    public VecinoRegistroResponse registrarVecino(@RequestBody VecinoRegistroRequest request) {
        System.out.println("llego al backend");
        return vecinoService.registrarVecinoPublico(request);
    }

    @GetMapping("me")
    public AuthenticatedUserResponse obtenerUsuarioAutenticado(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        Optional<Usuario> usuarioInterno = buscarUsuarioInterno(keycloakId, email);

        if (usuarioInterno.isPresent()) {
            Usuario usuario = usuarioInterno.get();
            String rolInterno = usuario.getRol() != null
                    ? normalizarRol(usuario.getRol().getCodigo(), usuario.getRol().getNombre())
                    : null;

            return new AuthenticatedUserResponse(keycloakId, usuario.getEmail(), rolInterno, null, null);
        }

        return vecinoService.confirmarVecinoAutenticado(
                keycloakId,
                email,
                obtenerRolAplicacion(jwt)
        );
    }

    private Optional<Usuario> buscarUsuarioInterno(String keycloakId, String email) {
        return usuarioRepository.findByKeycloakId(keycloakId)
                .or(() -> StringUtils.hasText(email)
                        ? usuarioRepository.findByEmailIgnoreCase(email.trim())
                        : Optional.empty());
    }

    private String normalizarRol(String codigo, String nombre) {
        return List.of(codigo, nombre)
                .stream()
                .filter(valor -> valor != null && !valor.isBlank())
                .map(valor -> valor.trim().toUpperCase())
                .filter(valor -> List.of("ADMINISTRADOR", "DIRECTIVO", "OPERATIVO", "VECINO").contains(valor))
                .findFirst()
                .orElse(null);
    }

    private String obtenerRolAplicacion(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        Object rolesClaim = realmAccess != null ? realmAccess.get("roles") : null;
        if (!(rolesClaim instanceof List<?> roles)) {
            return null;
        }

        return List.of("ADMINISTRADOR", "DIRECTIVO", "OPERATIVO", "VECINO")
                .stream()
                .filter(rol -> roles.contains(rol))
                .findFirst()
                .orElse(null);
    }
}
