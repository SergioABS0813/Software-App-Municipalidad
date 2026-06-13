package com.tesis.municipalidadbackendapp.vecinos.service;

import com.tesis.municipalidadbackendapp.asistencias.entity.Asistencia;
import com.tesis.municipalidadbackendapp.asistencias.repository.AsistenciaRepository;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.KeycloakAdminService;
import com.tesis.municipalidadbackendapp.vecinos.dto.EstadoVecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoContactoUpdateRequest;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoCuentaVecinalDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDetalleDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoInscripcionDto;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.VecinoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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
    private final InscripcionRepository inscripcionRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final VecinoNotificacionService vecinoNotificacionService;

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
}
