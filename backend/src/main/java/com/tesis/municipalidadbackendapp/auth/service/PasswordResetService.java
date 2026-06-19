package com.tesis.municipalidadbackendapp.auth.service;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.KeycloakAdminService;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.UsuarioNotificacionService;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.UsuarioService;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UsuarioService usuarioService;
    private final VecinoService vecinoService;
    private final KeycloakAdminService keycloakAdminService;

    public void requestPasswordReset(String correo, String dni){
        // Buscar en usuario interno
        Optional<Usuario> optionalUsuario = usuarioService.obtenerPorCorreoDni(correo.trim(), dni.trim());
        // Buscar vecino interno
        Optional<Vecino> optionalVecino = vecinoService.obtenerVecinoPorCorreoDni(correo.trim(), dni.trim());

        if (optionalUsuario.isPresent()){
            //Enviar correo Keycloak para actualizar contraseña
            String keycloakId = optionalUsuario.get().getKeycloakId();
            keycloakAdminService.enviarCorreoRecuperacionContrasena(keycloakId);
        }else if (optionalVecino.isPresent()){
            //Enviar correo Keycloak para actualizar contraseña
            String keycloakId = optionalVecino.get().getKeycloakId();
            keycloakAdminService.enviarCorreoRecuperacionContrasena(keycloakId);
        }else {
            throw new EntityNotFoundException("No se encontró una cuenta asociada al correo y DNI proporcionados.");
        }
    }
}
