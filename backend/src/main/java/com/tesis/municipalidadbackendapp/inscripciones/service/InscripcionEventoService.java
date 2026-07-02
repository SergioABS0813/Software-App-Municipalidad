package com.tesis.municipalidadbackendapp.inscripciones.service;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.inscripciones.dto.InscripcionEventoResponse;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.enums.EstadoInscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.pago_inscripcion.entity.PagoInscripcion;
import com.tesis.municipalidadbackendapp.pago_inscripcion.repository.PagoInscripcionRepository;
import com.tesis.municipalidadbackendapp.qr.dto.CodigoQrResponseDto;
import com.tesis.municipalidadbackendapp.qr.service.CodigoQrService;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.VecinoRepository;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoNotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class InscripcionEventoService {

    private final InscripcionRepository inscripcionRepository;
    private final EventoRepository eventoRepository;
    private final VecinoRepository vecinoRepository;
    private final VecinoNotificacionService vecinoNotificacionService;
    private final CodigoQrService codigoQrService;
    private final PagoInscripcionRepository pagoInscripcionRepository;
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    @Transactional
    public InscripcionEventoResponse inscribirEvento(Integer eventoId) {
        Vecino vecino = obtenerVecinoAutenticado();
        Evento evento = obtenerEventoPublicado(eventoId);

        if (!requiereInscripcion(evento)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este evento no requiere inscripcion previa");
        }

        return inscripcionRepository.findByEventoIdAndVecinoId(eventoId, vecino.getId())
                .map(inscripcion -> resolverInscripcionExistente(inscripcion, evento, vecino))
                .orElseGet(() -> registrarNuevaInscripcion(evento, vecino));
    }

    @Transactional(readOnly = true)
    public InscripcionEventoResponse obtenerInscripcionActual(Integer eventoId) {
        Vecino vecino = obtenerVecinoAutenticado();

        return inscripcionRepository.findByEventoIdAndVecinoId(eventoId, vecino.getId())
                .map(this::toResponse)
                .orElseGet(() -> new InscripcionEventoResponse(
                        null,
                        eventoId,
                        null,
                        vecino.getId(),
                        vecino.getNombre(),
                        null,
                        null,
                        "NO_INSCRITO",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                ));
    }

    @Transactional
    public InscripcionEventoResponse cancelarInscripcion(Integer eventoId) {
        Vecino vecino = obtenerVecinoAutenticado();
        Inscripcion inscripcion = inscripcionRepository
                .findByEventoIdAndVecinoId(eventoId, vecino.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No tienes una inscripcion para este evento"));

        if (inscripcion.getEstadoInscripcion() == EstadoInscripcion.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La inscripcion ya se encuentra cancelada");
        }

        inscripcion.setEstadoInscripcion(EstadoInscripcion.CANCELADA);
        inscripcion.setFechaCancelacion(Instant.now());
        codigoQrService.revocarQrsActivosPorInscripcion(inscripcion.getId());

        return toResponse(inscripcion);
    }

    private InscripcionEventoResponse resolverInscripcionExistente(Inscripcion inscripcion, Evento evento, Vecino vecino) {
        if (inscripcion.getEstadoInscripcion() == EstadoInscripcion.CONFIRMADA
                || inscripcion.getEstadoInscripcion() == EstadoInscripcion.PENDIENTE_PAGO
                || inscripcion.getEstadoInscripcion() == EstadoInscripcion.PAGO_OBSERVADO) {
            return toResponse(inscripcion);
        }

        if (inscripcion.getEstadoInscripcion() == EstadoInscripcion.CANCELADA) {
            return reactivarInscripcion(inscripcion, evento, vecino);
        }

        if (requierePago(evento)) {
            inscripcion.setEstadoInscripcion(EstadoInscripcion.PENDIENTE_PAGO);
            return toResponse(inscripcionRepository.save(inscripcion));
        }

        inscripcion.setEstadoInscripcion(EstadoInscripcion.CONFIRMADA);
        return guardarConfirmadaYNotificar(inscripcion);
    }

    private InscripcionEventoResponse registrarNuevaInscripcion(Evento evento, Vecino vecino) {
        validarCuposDisponibles(evento);

        ZonedDateTime ahora = ZonedDateTime.now(ZONA_LIMA).withZoneSameInstant(ZoneId.of("UTC"));
        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setEvento(evento);
        inscripcion.setVecino(vecino);
        inscripcion.setFechaInscripcion(ahora.toInstant());
        inscripcion.setOrigenInscripcion("PORTAL_PUBLICO");
        inscripcion.setCodigoInscripcion(generarCodigoInscripcion(evento, vecino, ahora.toInstant()));

        if (requierePago(evento)) {
            inscripcion.setEstadoInscripcion(EstadoInscripcion.PENDIENTE_PAGO);
            return toResponse(inscripcionRepository.save(inscripcion));
        }

        inscripcion.setEstadoInscripcion(EstadoInscripcion.CONFIRMADA);
        return guardarConfirmadaYNotificar(inscripcion);
    }

    private InscripcionEventoResponse reactivarInscripcion(Inscripcion inscripcion, Evento evento, Vecino vecino) {
        validarCuposDisponibles(evento);

        Instant ahora = Instant.now();
        inscripcion.setFechaInscripcion(ahora);
        inscripcion.setOrigenInscripcion("PORTAL_PUBLICO");
        inscripcion.setCodigoInscripcion(generarCodigoInscripcion(evento, vecino, ahora));
        inscripcion.setMotivoCancelacion(null);
        inscripcion.setObservacionCancelacion(null);
        inscripcion.setFechaCancelacion(null);

        if (requierePago(evento)) {
            inscripcion.setEstadoInscripcion(EstadoInscripcion.PENDIENTE_PAGO);
            return toResponse(inscripcionRepository.save(inscripcion));
        }

        inscripcion.setEstadoInscripcion(EstadoInscripcion.CONFIRMADA);
        return guardarConfirmadaYNotificar(inscripcion);
    }

    private InscripcionEventoResponse guardarConfirmadaYNotificar(Inscripcion inscripcion) {
        Inscripcion guardada = inscripcionRepository.save(inscripcion);
        if (requiereControlAsistencia(guardada.getEvento())) {
            CodigoQrResponseDto qr = codigoQrService.generarQrParaInscripcion(guardada.getId());
            vecinoNotificacionService.enviarConstanciaInscripcion(guardada, qr.qrDataUrl());
        } else {
            vecinoNotificacionService.enviarConstanciaInscripcion(guardada);
        }
        return toResponse(guardada);
    }

    private Evento obtenerEventoPublicado(Integer eventoId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        String estadoEvento = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";
        if (!"PUBLICADO".equals(estadoEvento)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El evento no esta disponible para inscripcion");
        }

        return evento;
    }

    private void validarCuposDisponibles(Evento evento) {
        Integer aforoMaximo = evento.getAforoMaximo();
        if (aforoMaximo != null && aforoMaximo > 0) {
            long totalInscritos = inscripcionRepository.countActivasByEventoId(evento.getId());
            if (totalInscritos >= aforoMaximo) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El evento ya no tiene cupos disponibles");
            }
        }
    }

    private boolean requierePago(Evento evento) {
        return evento != null && evento.getRequierePago() != null && evento.getRequierePago() == 1;
    }

    private boolean requiereInscripcion(Evento evento) {
        if (evento == null) {
            return true;
        }
        if (evento.getRequiereInscripcion() != null) {
            return evento.getRequiereInscripcion() == 1;
        }
        return requiereControlAsistencia(evento) || requierePago(evento);
    }

    private boolean requiereControlAsistencia(Evento evento) {
        return evento != null
                && evento.getRequiereControlAsistencia() != null
                && evento.getRequiereControlAsistencia() == 1;
    }

    private Vecino obtenerVecinoAutenticado() {
        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String keycloakId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");

        return vecinoRepository.findByKeycloakId(keycloakId)
                .or(() -> StringUtils.hasText(email) ? vecinoRepository.findByEmailIgnoreCase(email) : java.util.Optional.empty())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontro la cuenta vecinal autenticada"));
    }

    private String generarCodigoInscripcion(Evento evento, Vecino vecino, Instant fecha) {
        String dni = StringUtils.hasText(vecino.getDni()) ? vecino.getDni() : "0000";
        String sufijoDni = dni.length() <= 4 ? dni : dni.substring(dni.length() - 4);
        return "EC-" + evento.getId() + "-" + sufijoDni + "-" + Math.abs(fecha.toEpochMilli() % 100000);
    }

    private InscripcionEventoResponse toResponse(Inscripcion inscripcion) {
        String estado = inscripcion.getEstadoInscripcion() != null
                ? inscripcion.getEstadoInscripcion().name()
                : EstadoInscripcion.CONFIRMADA.name();
        PagoInscripcion pago = inscripcion.getId() != null
                ? pagoInscripcionRepository.findByInscripcionId(inscripcion.getId()).orElse(null)
                : null;

        return new InscripcionEventoResponse(
                inscripcion.getId(),
                inscripcion.getEvento().getId(),
                inscripcion.getEvento().getTitulo(),
                inscripcion.getVecino().getId(),
                inscripcion.getVecino().getNombre(),
                inscripcion.getCodigoInscripcion(),
                inscripcion.getFechaInscripcion(),
                estado,
                pago != null ? pago.getId() : null,
                pago != null ? pago.getEstadoPago() : null,
                pago != null ? pago.getObservacion() : null,
                pago != null ? pago.getUrlComprobante() : null,
                inscripcion.getMotivoCancelacion(),
                inscripcion.getObservacionCancelacion()
        );
    }
}