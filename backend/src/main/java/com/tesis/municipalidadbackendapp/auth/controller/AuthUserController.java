package com.tesis.municipalidadbackendapp.auth.controller;

import com.tesis.municipalidadbackendapp.auth.dto.AuthenticatedUserResponse;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoRegistroRequest;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoRegistroResponse;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/auth")
public class AuthUserController {

    private final VecinoService vecinoService;

    @PostMapping("vecinos/registro")
    public VecinoRegistroResponse registrarVecino(@RequestBody VecinoRegistroRequest request) {
        System.out.println("llego al backend");
        return vecinoService.registrarVecinoPublico(request);
    }

    @GetMapping("me")
    public AuthenticatedUserResponse obtenerUsuarioAutenticado(@AuthenticationPrincipal Jwt jwt) {
        return vecinoService.confirmarVecinoAutenticado(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                obtenerRolAplicacion(jwt)
        );
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
