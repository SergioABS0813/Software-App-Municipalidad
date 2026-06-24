package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoOperativoHoyDto;
import com.tesis.municipalidadbackendapp.eventos.dto.UsuarioOperativoDto;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.EventoOperativo;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoOperativoRepository;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.asistencias.repository.AsistenciaRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventoOperativoService {
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");
    private static final DateTimeFormatter FECHA_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    private final EventoOperativoRepository eventoOperativoRepository;
    private final EventoRepository eventoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final BitacoraAccionService bitacoraAccionService;
    private final InscripcionRepository inscripcionRepository;
    private final AsistenciaRepository asistenciaRepository;

    public List<UsuarioOperativoDto> listarOperativosActivos() {
        return usuarioRepository.findOperativosActivos().stream()
                .map(this::toUsuarioOperativoDto)
                .toList();
    }

    public List<UsuarioOperativoDto> listarOperativosAsignados(Evento evento) {
        return eventoOperativoRepository.findByEventoAndActivo(evento, (byte) 1).stream()
                .map(EventoOperativo::getUsuario)
                .filter(Objects::nonNull)
                .map(this::toUsuarioOperativoDto)
                .toList();
    }

    public boolean tieneOperativosActivos(Evento evento) {
        return evento != null && eventoOperativoRepository.countByEventoAndActivo(evento, (byte) 1) > 0;
    }

    @Transactional
    public void sincronizarOperativos(Evento evento, List<Integer> operativosIds, Usuario asignadoPor, HttpServletRequest request) {
        Set<Integer> idsSolicitados = new LinkedHashSet<>(
                operativosIds == null ? List.of() : operativosIds.stream().filter(Objects::nonNull).toList()
        );
        List<EventoOperativo> asignacionesActuales = eventoOperativoRepository.findByEvento(evento);

        for (Integer usuarioId : idsSolicitados) {
            Usuario operativo = obtenerOperativoAsignable(usuarioId);
            EventoOperativo existente = asignacionesActuales.stream()
                    .filter(asignacion -> asignacion.getUsuario() != null && usuarioId.equals(asignacion.getUsuario().getId()))
                    .findFirst()
                    .orElse(null);

            if (existente == null) {
                crearAsignacion(evento, operativo, asignadoPor, request);
            } else if (existente.getActivo() == null || existente.getActivo() == 0) {
                existente.setActivo((byte) 1);
                existente.setFechaAsignacion(Instant.now());
                existente.setAsignadoPor(asignadoPor);
                eventoOperativoRepository.save(existente);
                registrarBitacora("ASIGNAR_OPERATIVO_EVENTO", evento, operativo, asignadoPor, request);
            }
        }

        for (EventoOperativo asignacion : asignacionesActuales) {
            Integer usuarioId = asignacion.getUsuario() != null ? asignacion.getUsuario().getId() : null;
            boolean sigueAsignado = usuarioId != null && idsSolicitados.contains(usuarioId);

            if (!sigueAsignado && asignacion.getActivo() != null && asignacion.getActivo() == 1) {
                asignacion.setActivo((byte) 0);
                eventoOperativoRepository.save(asignacion);
                registrarBitacora("DESACTIVAR_OPERATIVO_EVENTO", evento, asignacion.getUsuario(), asignadoPor, request);
            }
        }
    }

    public void validarOperativoAsignado(Integer eventoId) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        validarRolOperativo(usuario);
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (evento.getRequiereControlAsistencia() == null || evento.getRequiereControlAsistencia() == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este evento no requiere control de asistencia");
        }

        if (!eventoOperativoRepository.existsByEventoIdAndUsuarioIdAndActivo(eventoId, usuario.getId(), (byte) 1)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El operativo no esta asignado a este evento");
        }
    }

    public List<EventoOperativoHoyDto> listarEventosHoyParaOperativo() {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        validarRolOperativo(usuario);

        LocalDateTime inicioDia = LocalDateTime.now(ZONA_LIMA).toLocalDate().atStartOfDay();
        Instant inicio = inicioDia.atZone(ZONA_LIMA).toInstant();
        Instant fin = inicioDia.plusDays(1).atZone(ZONA_LIMA).toInstant();

        return eventoOperativoRepository.findEventosAsignadosDelDia(
                        usuario,
                        inicio,
                        fin,
                        List.of("PUBLICADO", "EN_CURSO")
                ).stream()
                .map(this::toEventoOperativoHoyDto)
                .toList();
    }

    private void crearAsignacion(Evento evento, Usuario operativo, Usuario asignadoPor, HttpServletRequest request) {
        EventoOperativo asignacion = new EventoOperativo();
        asignacion.setEvento(evento);
        asignacion.setUsuario(operativo);
        asignacion.setFechaAsignacion(Instant.now());
        asignacion.setAsignadoPor(asignadoPor);
        asignacion.setActivo((byte) 1);
        eventoOperativoRepository.save(asignacion);
        registrarBitacora("ASIGNAR_OPERATIVO_EVENTO", evento, operativo, asignadoPor, request);
    }

    private Usuario obtenerOperativoAsignable(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario operativo seleccionado no existe"));

        if (usuario.getActivo() == null || usuario.getActivo() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede asignar un usuario inactivo");
        }

        validarRolOperativo(usuario);
        return usuario;
    }

    private void validarRolOperativo(Usuario usuario) {
        if (usuario == null || usuario.getRol() == null || !esRolOperativo(usuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo usuarios con rol OPERATIVO pueden realizar esta accion");
        }
    }

    private boolean esRolOperativo(Usuario usuario) {
        String codigo = usuario.getRol().getCodigo();
        String nombre = usuario.getRol().getNombre();
        return "OPERATIVO".equalsIgnoreCase(codigo) || "OPERATIVO".equalsIgnoreCase(nombre);
    }

    private UsuarioOperativoDto toUsuarioOperativoDto(Usuario usuario) {
        return new UsuarioOperativoDto(
                usuario.getId(),
                usuario.getNombre(),
                "",
                usuario.getDni(),
                usuario.getEmail(),
                usuario.getRol() != null
                        ? (usuario.getRol().getCodigo() != null && !usuario.getRol().getCodigo().isBlank()
                            ? usuario.getRol().getCodigo()
                            : usuario.getRol().getNombre())
                        : ""
        );
    }

    private EventoOperativoHoyDto toEventoOperativoHoyDto(Evento evento) {
        List<Integer> inscripcionIds = inscripcionRepository.findByEventoId(evento.getId()).stream()
                .map(inscripcion -> inscripcion.getId())
                .toList();
        long totalValidadas = inscripcionIds.isEmpty()
                ? 0
                : asistenciaRepository.findByInscripcionIdIn(inscripcionIds).stream()
                    .filter(asistencia -> !"ANULADA".equalsIgnoreCase(asistencia.getEstado()))
                    .count();
        long qrValidadas = inscripcionIds.isEmpty()
                ? 0
                : asistenciaRepository.findByInscripcionIdIn(inscripcionIds).stream()
                    .filter(asistencia -> !"ANULADA".equalsIgnoreCase(asistencia.getEstado()))
                    .filter(asistencia -> "QR".equalsIgnoreCase(asistencia.getMetodoValidacion()))
                    .count();
        long manualValidadas = totalValidadas - qrValidadas;
        LocalDateTime inicio = toLocalDateTime(evento.getFechaHoraInicio());
        LocalDateTime fin = toLocalDateTime(evento.getFechaHoraFin());

        return new EventoOperativoHoyDto(
                evento.getId(),
                evento.getTitulo(),
                evento.getDescripcionBreve(),
                evento.getDescripcion(),
                inicio,
                fin,
                inicio != null ? FECHA_FORMATTER.format(inicio) : "",
                inicio != null && fin != null ? HORA_FORMATTER.format(inicio) + " - " + HORA_FORMATTER.format(fin) : "",
                evento.getUbicacion() != null ? evento.getUbicacion().getNombre() : "Ubicacion pendiente",
                evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "",
                evento.getAforoMaximo(),
                inscripcionIds.size(),
                (int) totalValidadas,
                (int) qrValidadas,
                (int) manualValidadas
        );
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONA_LIMA);
    }

    private void registrarBitacora(
            String accion,
            Evento evento,
            Usuario operativo,
            Usuario asignadoPor,
            HttpServletRequest request
    ) {
        bitacoraAccionService.guardarAccion(
                accion,
                "EVENTO",
                evento.getId(),
                ("ASIGNAR_OPERATIVO_EVENTO".equals(accion) ? "Asigno personal operativo:" : "Removio personal operativo:")
                        + " " + (operativo != null ? operativo.getNombre() : "")
                        + " al evento \"" + (evento.getTitulo() != null ? evento.getTitulo() : "Sin titulo") + "\"",
                asignadoPor,
                request
        );
    }
}
