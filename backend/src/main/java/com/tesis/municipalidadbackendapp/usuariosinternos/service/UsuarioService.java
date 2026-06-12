package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.organizacion.service.AreaMunicipalService;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.RolConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponseVerDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Rol;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final AreaMunicipalService areaMunicipalService;
    private final RolService rolService;
    private final BitacoraAccionService bitacoraAccionService;
    private final KeycloakAdminService keycloakAdminService;

    @Transactional
    public UsuarioResponse guardarUsuario(UsuarioRequest usuarioRequest, HttpServletRequest httpServletRequest, Usuario usuarioAutenticado) {
        validarDatosCreacionUsuario(usuarioRequest);

        AreaMunicipal areaMunicipal = areaMunicipalService.obtenerAreaMunicipalporId(usuarioRequest.areaMunicipalId());
        if (areaMunicipal == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Area municipal no encontrada");
        }

        Rol rol = rolService.findById(usuarioRequest.rolId());
        if (rol == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol no encontrado");
        }

        String dni = usuarioRequest.dni().trim();
        String nombre = usuarioRequest.nombre().trim();
        String email = usuarioRequest.email().trim();
        String rolKeycloak = obtenerNombreRolKeycloak(rol);

        log.info("Iniciando creacion de usuario interno. dni={}, email={}, rol={}", dni, email, rolKeycloak);
        String keycloakId = keycloakAdminService.crearUsuarioInterno(nombre, email, rolKeycloak);

        try {
            Usuario usuario = new Usuario();
            usuario.setNombre(nombre);
            usuario.setDni(dni);
            usuario.setEmail(email);
            usuario.setKeycloakId(keycloakId);
            usuario.setAreaMunicipal(areaMunicipal);
            usuario.setRol(rol);
            usuario.setActivo((byte) 0);

            Usuario guardado = usuarioRepository.save(usuario);

            bitacoraAccionService.guardarAccion(
                    "CREAR_USUARIO",
                    "USUARIO",
                    guardado.getId(),
                    "Se creo el usuario con nombre: " + guardado.getNombre(),
                    usuarioAutenticado,
                    httpServletRequest
            );

            log.info("Usuario interno creado localmente. usuarioId={}, keycloakId={}, email={}",
                    guardado.getId(), keycloakId, email);

            return new UsuarioResponse(
                    guardado.getId(),
                    guardado.getNombre(),
                    guardado.getEmail(),
                    guardado.getAreaMunicipal().getNombre(),
                    guardado.getRol().getNombre()
            );
        } catch (RuntimeException exception) {
            log.error("Fallo el guardado local despues de crear usuario en Keycloak. keycloakId={}, email={}",
                    keycloakId, email, exception);
            keycloakAdminService.eliminarUsuario(keycloakId);
            throw exception;
        }
    }

    private void validarDatosCreacionUsuario(UsuarioRequest usuarioRequest) {
        if (usuarioRequest.dni() == null || usuarioRequest.dni().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El DNI es obligatorio");
        }

        if (usuarioRequest.nombre() == null || usuarioRequest.nombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio");
        }

        if (usuarioRequest.email() == null || usuarioRequest.email().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo es obligatorio");
        }

        if (usuarioRequest.areaMunicipalId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El area municipal es obligatoria");
        }

        if (usuarioRequest.rolId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol es obligatorio");
        }

        String dni = usuarioRequest.dni().trim();
        String email = usuarioRequest.email().trim();

        if (usuarioRepository.existsByDni(dni)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese DNI");
        }

        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese correo");
        }
    }

    private String obtenerNombreRolKeycloak(Rol rol) {
        String rolKeycloak = rol.getCodigo() != null && !rol.getCodigo().isBlank()
                ? rol.getCodigo().trim()
                : rol.getNombre();

        if (rolKeycloak == null || rolKeycloak.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol no tiene codigo para Keycloak");
        }

        return rolKeycloak.trim();
    }

    public List<UsuarioConfiguracionDto> obtenerUsuariosInternos() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToUsuarioConfiguracionDto)
                .toList();
    }

    public Page<UsuarioConfiguracionDto> buscarUsuariosInternos(String texto, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        return usuarioRepository.buscarPorNombreCorreoORol(texto, pageable)
                .map(this::mapToUsuarioConfiguracionDto);
    }

    public UsuarioResponseVerDto obtenerUsuarioInternoPorId(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return new UsuarioResponseVerDto(
                usuario.getDni(),
                usuario.getNombre(),
                usuario.getActivo(),
                usuario.getEmail(),
                usuario.getAreaMunicipal().getId(),
                usuario.getRol().getId()
        );
    }

    public Usuario obtenerPorKeycloakId(String keycloakId) {
        return usuarioRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Usuario no registrado en el sistema"
                ));
    }

    private UsuarioConfiguracionDto mapToUsuarioConfiguracionDto(Usuario usuario) {
        return new UsuarioConfiguracionDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                new RolConfiguracionDto(usuario.getRol().getId(), usuario.getRol().getNombre()),
                usuario.getActivo()
        );
    }
}
