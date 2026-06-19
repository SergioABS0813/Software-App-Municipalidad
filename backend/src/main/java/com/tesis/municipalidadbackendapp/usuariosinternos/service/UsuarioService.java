package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.organizacion.service.AreaMunicipalService;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.RolConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponseVerDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioUpdateRequest;
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
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {
    private static final int MAX_EMAIL_LENGTH = 45;
    private static final String EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    private final UsuarioRepository usuarioRepository;
    private final AreaMunicipalService areaMunicipalService;
    private final RolService rolService;
    private final BitacoraAccionService bitacoraAccionService;
    private final KeycloakAdminService keycloakAdminService;
    private final UsuarioNotificacionService usuarioNotificacionService;

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

    public Optional<Usuario> obtenerPorCorreoDni(String email, String dni){
        return usuarioRepository.findByEmailAndDni(email, dni);
    }

    public List<UsuarioConfiguracionDto> obtenerUsuariosInternos() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToUsuarioConfiguracionDto)
                .toList();
    }

    public Page<UsuarioConfiguracionDto> buscarUsuariosInternos(String texto, Integer rolId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        return usuarioRepository.buscarPorNombreCorreoORol(texto, rolId, pageable)
                .map(this::mapToUsuarioConfiguracionDto);
    }

    public UsuarioResponseVerDto obtenerUsuarioInternoPorId(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                ));

        return new UsuarioResponseVerDto(
                usuario.getDni(),
                usuario.getNombre(),
                usuario.getActivo(),
                usuario.getEmail(),
                usuario.getAreaMunicipal().getId(),
                usuario.getRol().getId()
        );
    }

    @Transactional
    public UsuarioResponseVerDto actualizarUsuarioInterno(
            Integer id,
            UsuarioUpdateRequest request,
            Usuario usuarioAutenticado,
            HttpServletRequest httpServletRequest
    ) {
        Usuario usuario = obtenerUsuarioEditable(id);
        validarDatosEdicionUsuario(request, id);

        AreaMunicipal areaMunicipal = areaMunicipalService.obtenerAreaMunicipalporId(request.areaMunicipalId());
        if (areaMunicipal == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Area municipal no encontrada");
        }

        Rol rolNuevo = rolService.findById(request.rolId());
        if (rolNuevo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol no encontrado");
        }

        String emailAnterior = usuario.getEmail();
        String rolAnteriorKeycloak = obtenerNombreRolKeycloak(usuario.getRol());
        String rolNuevoKeycloak = obtenerNombreRolKeycloak(rolNuevo);
        String emailNuevo = request.email().trim();
        boolean cambioCorreo = !emailAnterior.equalsIgnoreCase(emailNuevo);
        boolean cambioArea = !usuario.getAreaMunicipal().getId().equals(areaMunicipal.getId());
        boolean cambioRol = !usuario.getRol().getId().equals(rolNuevo.getId());

        if (cambioCorreo) {
            keycloakAdminService.actualizarCorreoUsuario(usuario.getKeycloakId(), usuario.getNombre(), emailNuevo);
        }

        if (cambioRol) {
            keycloakAdminService.actualizarRolUsuario(usuario.getKeycloakId(), rolAnteriorKeycloak, rolNuevoKeycloak);
        }

        usuario.setEmail(emailNuevo);
        usuario.setAreaMunicipal(areaMunicipal);
        usuario.setRol(rolNuevo);
        Usuario guardado = usuarioRepository.save(usuario);

        if (cambioCorreo) {
            usuarioNotificacionService.notificarCorreoAccesoSeleccionado(emailNuevo, guardado.getNombre());
            usuarioNotificacionService.notificarCorreoAnteriorReemplazado(emailAnterior, emailNuevo, guardado.getNombre());
        }

        registrarActualizacionUsuario(guardado, usuarioAutenticado, httpServletRequest, cambioCorreo, cambioArea, cambioRol);
        return mapToUsuarioResponseVerDto(guardado);
    }

    @Transactional
    public UsuarioResponseVerDto actualizarEstadoUsuarioInterno(
            Integer id,
            String estado,
            Usuario usuarioAutenticado,
            HttpServletRequest httpServletRequest
    ) {
        Usuario usuario = obtenerUsuarioEditable(id);
        if (estado == null || (!"ACTIVO".equalsIgnoreCase(estado) && !"INACTIVO".equalsIgnoreCase(estado))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de usuario invalido");
        }

        boolean activar = !"INACTIVO".equalsIgnoreCase(estado);
        Byte nuevoActivo = activar ? (byte) 1 : (byte) 0;

        if (!nuevoActivo.equals(usuario.getActivo())) {
            keycloakAdminService.actualizarEstadoUsuario(usuario.getKeycloakId(), activar);
            usuario.setActivo(nuevoActivo);
            usuarioRepository.save(usuario);

            bitacoraAccionService.guardarAccion(
                    activar ? "ACTIVAR_USUARIO_INTERNO" : "DESACTIVAR_USUARIO_INTERNO",
                    "USUARIO",
                    usuario.getId(),
                    (activar ? "Se activo" : "Se desactivo") + " el usuario interno: " + usuario.getNombre(),
                    usuarioAutenticado,
                    httpServletRequest
            );
        }

        return mapToUsuarioResponseVerDto(usuario);
    }

    @Transactional
    public Usuario obtenerPorKeycloakId(String keycloakId) {
        Usuario usuario = usuarioRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Usuario no registrado en el sistema"
                ));

        if (usuario.getActivo() == null || usuario.getActivo() == 0) {
            usuario.setActivo((byte) 1);
            return usuarioRepository.save(usuario);
        }

        return usuario;
    }

    private UsuarioConfiguracionDto mapToUsuarioConfiguracionDto(Usuario usuario) {
        return new UsuarioConfiguracionDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                new RolConfiguracionDto(
                        usuario.getRol().getId(),
                        usuario.getRol().getCodigo() != null && !usuario.getRol().getCodigo().isBlank()
                                ? usuario.getRol().getCodigo()
                                : usuario.getRol().getNombre()
                ),
                usuario.getActivo()
        );
    }

    private Usuario obtenerUsuarioEditable(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                ));
    }

    private void validarDatosEdicionUsuario(UsuarioUpdateRequest request, Integer usuarioId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del usuario son requeridos");
        }

        if (request.email() == null || request.email().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo es obligatorio");
        }

        if (request.areaMunicipalId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El area municipal es obligatoria");
        }

        if (request.rolId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol es obligatorio");
        }

        String email = request.email().trim();

        if (email.length() > MAX_EMAIL_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El correo no debe exceder los " + MAX_EMAIL_LENGTH + " caracteres"
            );
        }

        if (!email.matches(EMAIL_PATTERN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingrese un correo electronico valido");
        }

        if (usuarioRepository.existsByEmailAndIdNot(email, usuarioId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese correo");
        }
    }

    private UsuarioResponseVerDto mapToUsuarioResponseVerDto(Usuario usuario) {
        return new UsuarioResponseVerDto(
                usuario.getDni(),
                usuario.getNombre(),
                usuario.getActivo(),
                usuario.getEmail(),
                usuario.getAreaMunicipal().getId(),
                usuario.getRol().getId()
        );
    }

    private void registrarActualizacionUsuario(
            Usuario usuario,
            Usuario usuarioAutenticado,
            HttpServletRequest httpServletRequest,
            boolean cambioCorreo,
            boolean cambioArea,
            boolean cambioRol
    ) {
        if (!cambioCorreo && !cambioArea && !cambioRol) {
            return;
        }

        StringBuilder detalle = new StringBuilder("Se actualizo el usuario interno: ")
                .append(usuario.getNombre())
                .append(". Campos modificados: ");

        if (cambioCorreo) {
            detalle.append("correo ");
        }
        if (cambioArea) {
            detalle.append("area ");
        }
        if (cambioRol) {
            detalle.append("rol ");
        }

        bitacoraAccionService.guardarAccion(
                "ACTUALIZAR_USUARIO_INTERNO",
                "USUARIO",
                usuario.getId(),
                detalle.toString().trim(),
                usuarioAutenticado,
                httpServletRequest
        );
    }
}
