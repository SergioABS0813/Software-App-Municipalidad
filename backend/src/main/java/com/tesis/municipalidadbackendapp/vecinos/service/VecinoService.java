package com.tesis.municipalidadbackendapp.vecinos.service;

import com.tesis.municipalidadbackendapp.asistencias.entity.Asistencia;
import com.tesis.municipalidadbackendapp.asistencias.repository.AsistenciaRepository;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.auth.dto.AuthenticatedUserResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.KeycloakAdminService;
import com.tesis.municipalidadbackendapp.vecinos.dto.EstadoVecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoContactoUpdateRequest;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoCuentaVecinalDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDetalleDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoInscripcionDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoPerfilDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoPerfilUpdateRequest;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoRegistroRequest;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoRegistroResponse;
import com.tesis.municipalidadbackendapp.vecinos.entity.EstadoVecino;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.EstadoVecinoRepository;
import com.tesis.municipalidadbackendapp.vecinos.repository.VecinoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VecinoService {

    private static final Set<String> ESTADOS_CUENTA_VECINAL = Set.of(
            "PENDIENTE_CONFIRMACION",
            "INACTIVO",
            "ACTIVO"
    );
    private static final int MAX_EMAIL_LENGTH = 45;
    private static final int MAX_CELULAR_LENGTH = 15;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern CELULAR_PATTERN = Pattern.compile("^\\d{6,15}$");
    private static final ZoneId LIMA_ZONE = ZoneId.of("America/Lima");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(LIMA_ZONE);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(LIMA_ZONE);

    private final VecinoRepository vecinoRepository;
    private final EstadoVecinoRepository estadoVecinoRepository;
    private final UsuarioRepository usuarioRepository;
    private final InscripcionRepository inscripcionRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final VecinoNotificacionService vecinoNotificacionService;

    public Optional<Vecino> obtenerVecinoPorCorreoDni(String email, String dni){
        return vecinoRepository.findByEmailAndDni(email, dni);
    }

    @Transactional(readOnly = true)
    public VecinoPerfilDto obtenerPerfilVecinoAutenticado(String keycloakId, String email) {
        Vecino vecino = obtenerVecinoAutenticado(keycloakId, email);
        return mapToPerfilDto(vecino);
    }

    @Transactional
    public VecinoPerfilDto actualizarPerfilVecinoAutenticado(
            String keycloakId,
            String email,
            VecinoPerfilUpdateRequest request
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos de perfil son obligatorios.");
        }

        Vecino vecino = obtenerVecinoAutenticado(keycloakId, email);
        validarIdentidadNoEditable(vecino, request);

        String correoAnterior = nullToEmpty(vecino.getEmail());
        String correoNuevo = validarCorreo(request.correo(), vecino.getId());
        String celularNuevo = validarCelular(request.celular());
        Instant fechaNacimientoNueva = parseFechaNacimiento(normalizarFechaNacimiento(request.fechaNacimiento()));
        boolean aceptaTratamientoDatos = Boolean.TRUE.equals(request.aceptaTratamientoDatos());
        boolean cambioCorreo = !correoAnterior.equalsIgnoreCase(correoNuevo);

        if (cambioCorreo && StringUtils.hasText(vecino.getKeycloakId())) {
            keycloakAdminService.actualizarCorreoUsuario(vecino.getKeycloakId(), vecino.getNombre(), correoNuevo);
        }

        vecino.setEmail(correoNuevo);
        vecino.setCelular(celularNuevo);
        vecino.setFechaNacimiento(fechaNacimientoNueva);
        vecino.setAceptaTratamientoDatos((byte) (aceptaTratamientoDatos ? 1 : 0));

        if (aceptaTratamientoDatos && vecino.getFechaAceptacionDatos() == null) {
            vecino.setFechaAceptacionDatos(Instant.now());
        }

        Vecino guardado = vecinoRepository.save(vecino);
        return mapToPerfilDto(guardado);
    }

    @Transactional
    public VecinoRegistroResponse registrarVecinoPublico(VecinoRegistroRequest request) {
        DatosRegistroVecino datos = validarRegistroVecino(request);

        validarDatosDuplicados(datos);

        log.info("Iniciando registro publico de vecino. dni={}, email={}", datos.dni(), datos.email());
        String keycloakId = keycloakAdminService.crearVecino(
                datos.nombreCompleto(),
                datos.email(),
                datos.dni(),
                datos.celular(),
                datos.fechaNacimientoTexto()
        );

        try {
            Instant ahora = Instant.now();
            Vecino vecino = new Vecino();
            vecino.setKeycloakId(keycloakId);
            vecino.setNombre(datos.nombreCompleto());
            vecino.setDni(datos.dni());
            vecino.setEmail(datos.email());
            vecino.setCelular(datos.celular());
            vecino.setFechaNacimiento(datos.fechaNacimiento());
            vecino.setFechaCreado(ahora);
            vecino.setAceptaTratamientoDatos((byte) 1);
            vecino.setFechaAceptacionDatos(ahora);
            vecino.setEstadoVecino(obtenerEstadoInicialVecino());

            Vecino guardado = vecinoRepository.save(vecino);
            log.info("Vecino guardado en MySQL. vecinoId={}, keycloakId={}, email={}",
                    guardado.getId(), keycloakId, datos.email());

            return new VecinoRegistroResponse(
                    guardado.getId(),
                    guardado.getEstadoVecino().getNombre(),
                    "Cuenta creada. Te enviamos un correo para configurar tu contrasena."
            );
        } catch (RuntimeException exception) {
            log.error("Fallo el guardado local despues de crear vecino en Keycloak. keycloakId={}, email={}",
                    keycloakId, datos.email(), exception);
            keycloakAdminService.eliminarUsuario(keycloakId);
            throw exception;
        }
    }

    @Transactional
    public AuthenticatedUserResponse confirmarVecinoAutenticado(String keycloakId, String email, String rol) {
        if (!StringUtils.hasText(keycloakId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion invalida.");
        }

        Optional<Vecino> vecinoOptional = vecinoRepository.findByKeycloakId(keycloakId)
                .or(() -> StringUtils.hasText(email) ? vecinoRepository.findByEmailIgnoreCase(email.trim().toLowerCase()) : Optional.empty());

        if (vecinoOptional.isEmpty()) {
            return new AuthenticatedUserResponse(keycloakId, email, rol, null, null);
        }

        Vecino vecino = vecinoOptional.get();
        String estadoActual = vecino.getEstadoVecino() != null ? vecino.getEstadoVecino().getNombre() : "";
        if (!"ACTIVO".equalsIgnoreCase(estadoActual)) {
            vecino.setEstadoVecino(obtenerEstadoVecino("ACTIVO"));
            vecino = vecinoRepository.save(vecino);
            log.info("Vecino activado despues de autenticacion exitosa. vecinoId={}, keycloakId={}", vecino.getId(), keycloakId);
        }

        return new AuthenticatedUserResponse(
                keycloakId,
                vecino.getEmail(),
                rol,
                vecino.getId(),
                vecino.getEstadoVecino().getNombre()
        );
    }

    public List<VecinoDirectorioDto> obtenerTodosVecinos() {
        return vecinoRepository.findAll().stream()
                .map(vecino -> new VecinoDirectorioDto(
                        vecino.getId(),
                        vecino.getNombre(),
                        vecino.getDni(),
                        vecino.getEmail(),
                        new EstadoVecinoDirectorioDto(
                                vecino.getEstadoVecino().getId(),
                                vecino.getEstadoVecino().getNombre()
                        )
                ))
                .toList();
    }

    public Page<VecinoDirectorioDto> listarDirectorio(String texto, Integer estadoId, Pageable pageable) {
        return vecinoRepository.buscarDirectorio(texto, estadoId, pageable)
                .map(this::mapToDirectorioDto);
    }

    public Page<VecinoCuentaVecinalDto> listarCuentasVecinales(String texto, String estado, Pageable pageable) {
        String estadoNormalizado = normalizarEstadoCuentaVecinal(estado);

        return vecinoRepository.buscarCuentasVecinales(normalizarTexto(texto), estadoNormalizado, pageable)
                .map(this::mapToCuentaVecinalDto);
    }

    @Transactional(readOnly = true)
    public VecinoDetalleDto obtenerDetalleCuentaVecinal(Integer id) {
        Vecino vecino = obtenerVecinoDetalle(id);
        return mapToDetalleDto(vecino, obtenerInscripcionesDto(vecino.getId()));
    }

    @Transactional
    public VecinoDetalleDto actualizarContactoCuentaVecinal(Integer id, VecinoContactoUpdateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos de contacto son obligatorios.");
        }

        Vecino vecino = obtenerVecinoDetalle(id);
        String correoAnterior = nullToEmpty(vecino.getEmail());
        String celularAnterior = nullToEmpty(vecino.getCelular());
        String correoNuevo = validarCorreo(request.correo(), id);
        String celularNuevo = validarCelular(request.celular());

        boolean cambioCorreo = !correoAnterior.equalsIgnoreCase(correoNuevo);
        boolean cambioCelular = !celularAnterior.equals(celularNuevo);

        if (!cambioCorreo && !cambioCelular) {
            return mapToDetalleDto(vecino, obtenerInscripcionesDto(vecino.getId()));
        }

        if (cambioCorreo && StringUtils.hasText(vecino.getKeycloakId())) {
            keycloakAdminService.actualizarCorreoUsuario(vecino.getKeycloakId(), vecino.getNombre(), correoNuevo);
        }

        vecino.setEmail(correoNuevo);
        vecino.setCelular(celularNuevo);
        Vecino guardado = vecinoRepository.save(vecino);

        enviarNotificacionesContacto(guardado, correoAnterior, correoNuevo, cambioCorreo, cambioCelular);

        return mapToDetalleDto(guardado, obtenerInscripcionesDto(guardado.getId()));
    }

    private VecinoDetalleDto mapToDetalleDto(Vecino vecino, List<VecinoInscripcionDto> inscripciones) {

        return new VecinoDetalleDto(
                vecino.getId(),
                vecino.getNombre(),
                vecino.getDni(),
                vecino.getEmail(),
                vecino.getCelular(),
                formatDate(vecino.getFechaNacimiento()),
                formatDate(vecino.getFechaCreado()),
                vecino.getEstadoVecino().getNombre(),
                inscripciones
        );
    }

    private VecinoPerfilDto mapToPerfilDto(Vecino vecino) {
        return new VecinoPerfilDto(
                vecino.getId(),
                vecino.getNombre(),
                vecino.getDni(),
                vecino.getEmail(),
                vecino.getCelular(),
                formatDate(vecino.getFechaNacimiento()),
                Byte.valueOf((byte) 1).equals(vecino.getAceptaTratamientoDatos()),
                vecino.getEstadoVecino() != null ? vecino.getEstadoVecino().getNombre() : ""
        );
    }

    private List<VecinoInscripcionDto> obtenerInscripcionesDto(Integer vecinoId) {
        List<Inscripcion> inscripciones = inscripcionRepository.findDetalleByVecinoId(vecinoId);
        if (inscripciones.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Integer, Asistencia> asistenciasPorInscripcion = asistenciaRepository
                .findByInscripcionIdIn(inscripciones.stream().map(Inscripcion::getId).toList())
                .stream()
                .collect(Collectors.toMap(
                        asistencia -> asistencia.getInscripcion().getId(),
                        Function.identity(),
                        (current, replacement) -> current
                ));

        return inscripciones.stream()
                .map(inscripcion -> mapToInscripcionDto(inscripcion, asistenciasPorInscripcion.get(inscripcion.getId())))
                .toList();
    }

    private VecinoInscripcionDto mapToInscripcionDto(Inscripcion inscripcion, Asistencia asistencia) {
        return new VecinoInscripcionDto(
                inscripcion.getId(),
                inscripcion.getEvento().getTitulo(),
                formatDateTime(inscripcion.getEvento().getFechaHoraInicio()),
                inscripcion.getCodigoInscripcion(),
                normalizarEstadoInscripcion(inscripcion),
                asistencia == null || !StringUtils.hasText(asistencia.getEstado())
                        ? "Pendiente"
                        : asistencia.getEstado()
        );
    }

    private String normalizarEstadoInscripcion(Inscripcion inscripcion) {
        return StringUtils.hasText(inscripcion.getCodigoInscripcion()) ? "Confirmada" : "Registrada";
    }

    private VecinoDirectorioDto mapToDirectorioDto(Vecino vecino) {
        EstadoVecinoDirectorioDto estadoVecinoDto = new EstadoVecinoDirectorioDto(
                vecino.getEstadoVecino().getId(),
                vecino.getEstadoVecino().getNombre()
        );
        return new VecinoDirectorioDto(
                vecino.getId(),
                vecino.getNombre(),
                vecino.getDni(),
                vecino.getEmail(),
                estadoVecinoDto
        );
    }

    private VecinoCuentaVecinalDto mapToCuentaVecinalDto(Vecino vecino) {
        return new VecinoCuentaVecinalDto(
                vecino.getId(),
                vecino.getNombre(),
                vecino.getDni(),
                vecino.getEmail(),
                vecino.getEstadoVecino().getNombre()
        );
    }

    private Vecino obtenerVecinoDetalle(Integer id) {
        return vecinoRepository.findDetalleById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la cuenta vecinal."));
    }

    private Vecino obtenerVecinoAutenticado(String keycloakId, String email) {
        if (!StringUtils.hasText(keycloakId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion invalida.");
        }

        return vecinoRepository.findByKeycloakId(keycloakId)
                .or(() -> StringUtils.hasText(email)
                        ? vecinoRepository.findByEmailIgnoreCase(email.trim().toLowerCase())
                        : Optional.empty())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontro la cuenta vecinal autenticada."));
    }

    private void validarIdentidadNoEditable(Vecino vecino, VecinoPerfilUpdateRequest request) {
        if (request.dni() != null && !nullToEmpty(vecino.getDni()).equals(request.dni().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El DNI no se puede modificar.");
        }

        if (request.nombreCompleto() != null && !nullToEmpty(vecino.getNombre()).equals(request.nombreCompleto().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre no se puede modificar.");
        }
    }

    private String validarCorreo(String correo, Integer vecinoId) {
        if (!StringUtils.hasText(correo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo es obligatorio.");
        }

        String correoNormalizado = correo.trim().toLowerCase();

        if (correoNormalizado.length() > MAX_EMAIL_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo no debe exceder los 45 caracteres.");
        }

        if (!EMAIL_PATTERN.matcher(correoNormalizado).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingrese un correo electrónico válido.");
        }

        if (vecinoRepository.existsByEmailIgnoreCaseAndIdNot(correoNormalizado, vecinoId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta vecinal con ese correo.");
        }

        return correoNormalizado;
    }

    private String validarCelular(String celular) {
        if (!StringUtils.hasText(celular)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El celular es obligatorio.");
        }

        String celularNormalizado = celular.trim().replaceAll("\\s+", "");

        if (celularNormalizado.length() > MAX_CELULAR_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El celular no debe exceder los 15 caracteres.");
        }

        if (!CELULAR_PATTERN.matcher(celularNormalizado).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingrese un celular válido.");
        }

        return celularNormalizado;
    }

    private void enviarNotificacionesContacto(
            Vecino vecino,
            String correoAnterior,
            String correoNuevo,
            boolean cambioCorreo,
            boolean cambioCelular
    ) {
        vecinoNotificacionService.notificarCambioContacto(
                correoNuevo,
                vecino.getNombre(),
                correoNuevo,
                vecino.getCelular(),
                cambioCorreo,
                cambioCelular
        );

        if (cambioCorreo && StringUtils.hasText(correoAnterior) && !correoAnterior.equalsIgnoreCase(correoNuevo)) {
            vecinoNotificacionService.notificarCambioContacto(
                    correoAnterior,
                    vecino.getNombre(),
                    correoNuevo,
                    vecino.getCelular(),
                    true,
                    cambioCelular
            );
        }
    }

    private String normalizarTexto(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }

    private String normalizarEstadoCuentaVecinal(String estado) {
        if (estado == null || estado.isBlank() || "TODOS".equalsIgnoreCase(estado)) {
            return null;
        }

        String estadoNormalizado = estado.trim().toUpperCase();

        if (!ESTADOS_CUENTA_VECINAL.contains(estadoNormalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de cuenta vecinal no válido.");
        }

        return estadoNormalizado;
    }

    private String formatDate(Instant instant) {
        if (instant == null) {
            return "";
        }

        return DATE_FORMATTER.format(instant);
    }

    private String formatDateTime(Instant instant) {
        if (instant == null) {
            return "";
        }

        return DATE_TIME_FORMATTER.format(instant);
    }

    private String nullToEmpty(String value) {
        return Objects.toString(value, "");
    }
    private DatosRegistroVecino validarRegistroVecino(VecinoRegistroRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos de registro son obligatorios.");
        }

        String dni = normalizarDni(request.dni());
        String email = validarCorreoNuevo(request.email());
        String celular = validarCelular(request.celular());
        String nombre = normalizarNombre(request.nombreCompleto());
        String fechaNacimientoTexto = normalizarFechaNacimiento(request.fechaNacimiento());
        Instant fechaNacimiento = parseFechaNacimiento(fechaNacimientoTexto);

        if (!Boolean.TRUE.equals(request.aceptaTratamientoDatos())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes aceptar el uso de tus datos para crear la cuenta.");
        }

        return new DatosRegistroVecino(dni, nombre, email, celular, fechaNacimientoTexto, fechaNacimiento);
    }

    private String normalizarDni(String dni) {
        if (!StringUtils.hasText(dni)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El DNI es obligatorio.");
        }

        String dniNormalizado = dni.trim();
        if (!dniNormalizado.matches("^\\d{8}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un DNI valido de 8 digitos.");
        }
        return dniNormalizado;
    }

    private String validarCorreoNuevo(String correo) {
        if (!StringUtils.hasText(correo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo electronico es obligatorio.");
        }

        String correoNormalizado = correo.trim().toLowerCase();
        if (correoNormalizado.length() > MAX_EMAIL_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo no debe exceder los 45 caracteres.");
        }

        if (!EMAIL_PATTERN.matcher(correoNormalizado).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un correo electronico valido.");
        }
        return correoNormalizado;
    }

    private String normalizarNombre(String nombre) {
        if (!StringUtils.hasText(nombre)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valida tu identidad antes de crear la cuenta.");
        }
        return nombre.trim();
    }

    private String normalizarFechaNacimiento(String fechaNacimiento) {
        if (!StringUtils.hasText(fechaNacimiento)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de nacimiento es obligatoria.");
        }
        return fechaNacimiento.trim();
    }

    private Instant parseFechaNacimiento(String fechaNacimiento) {
        try {
            return LocalDate.parse(fechaNacimiento).atStartOfDay(LIMA_ZONE).toInstant();
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa una fecha de nacimiento valida.");
        }
    }

    private EstadoVecino obtenerEstadoInicialVecino() {
        return estadoVecinoRepository.findByNombre("PENDIENTE_CONFIRMACION")
                .or(() -> estadoVecinoRepository.findByNombre("INACTIVO"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No existe un estado inicial para vecinos."));
    }

    private EstadoVecino obtenerEstadoVecino(String nombre) {
        return estadoVecinoRepository.findByNombre(nombre)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No existe el estado de vecino " + nombre + "."));
    }

    private void validarDatosDuplicados(DatosRegistroVecino datos) {
        if (vecinoRepository.existsByDni(datos.dni())) {
            log.warn("Registro publico rechazado: DNI ya registrado como vecino. dni={}", datos.dni());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El DNI ya esta registrado.");
        }

        if (usuarioRepository.existsByDni(datos.dni())) {
            log.warn("Registro publico rechazado: DNI ya registrado como vecino. dni={}", datos.dni());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El DNI ya esta registrado como usuario interno.");
        }

        if (vecinoRepository.existsByEmailIgnoreCase(datos.email())) {
            log.warn("Registro publico rechazado: correo ya registrado como vecino. email={}", datos.email());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado.");
        }

        if (usuarioRepository.existsByEmail(datos.email())) {
            log.warn("Registro publico rechazado: correo ya registrado como usuario interno. email={}", datos.email());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado como usuario interno.");
        }

        if (keycloakAdminService.existeUsuarioPorEmail(datos.email())) {
            log.warn("Registro publico rechazado: correo ya registrado en Keycloak. email={}", datos.email());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado.");
        }

    }

    private record DatosRegistroVecino(
            String dni,
            String nombreCompleto,
            String email,
            String celular,
            String fechaNacimientoTexto,
            Instant fechaNacimiento
    ) {
    }
}
