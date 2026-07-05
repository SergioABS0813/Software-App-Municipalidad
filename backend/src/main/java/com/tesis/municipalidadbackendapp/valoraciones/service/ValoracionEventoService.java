package com.tesis.municipalidadbackendapp.valoraciones.service;

import static com.tesis.municipalidadbackendapp.common.FechaHoraUtils.ahoraLima;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.valoraciones.dto.ValoracionGeneracionResponse;
import com.tesis.municipalidadbackendapp.valoraciones.dto.ValoracionTokenResponse;
import com.tesis.municipalidadbackendapp.valoraciones.entity.ValoracionEvento;
import com.tesis.municipalidadbackendapp.valoraciones.repository.ValoracionEventoRepository;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoNotificacionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ValoracionEventoService {
    private static final String ESTADO_PENDIENTE = "PENDIENTE";
    private static final String ESTADO_RESPONDIDA = "RESPONDIDA";
    private static final String ESTADO_RESPONDIDO_LEGACY = "RESPONDIDO";
    private static final String ESTADO_EXPIRADA = "EXPIRADA";
    private static final String ESTADO_INVALIDA = "INVALIDA";
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    private final EventoRepository eventoRepository;
    private final InscripcionRepository inscripcionRepository;
    private final ValoracionEventoRepository valoracionEventoRepository;
    private final VecinoNotificacionService vecinoNotificacionService;
    private final BitacoraAccionService bitacoraAccionService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.valoraciones.expiracion-dias:7}")
    private int expiracionDias;

    @Transactional
    public ValoracionGeneracionResponse generarValoracionesParaEventoFinalizado(
            Integer eventoId,
            Usuario usuario,
            HttpServletRequest request
    ) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        validarEventoFinalizado(evento);

        if (!encuestaSatisfaccionHabilitada(evento)) {
            return new ValoracionGeneracionResponse(eventoId, 0, 0);
        }

        ValoracionGeneracionResponse response = generarValoracionesParaEvento(evento);

        if (usuario != null && request != null && response.valoracionesGeneradas() > 0) {
            bitacoraAccionService.guardarAccion(
                    "GENERACION_VALORACIONES_EVENTO",
                    "EVENTO",
                    evento.getId(),
                    "Se generaron " + response.valoracionesGeneradas() + " valoraciones para el evento \"" + valorDetalle(evento.getTitulo()) + "\"",
                    usuario,
                    request
            );
        }

        return response;
    }

    @Transactional
    public ValoracionGeneracionResponse generarValoracionesParaEvento(Evento evento) {
        if (evento == null || evento.getId() == null) {
            return new ValoracionGeneracionResponse(null, 0, 0);
        }

        List<Inscripcion> inscripcionesElegibles = inscripcionRepository.findElegiblesParaValoracion(evento.getId());
        Instant ahora = ahoraLima();
        Instant fechaExpiracion = ahora.plusSeconds(Math.max(1, expiracionDias) * 24L * 60L * 60L);
        int generadas = 0;
        int correosEnviados = 0;

        for (Inscripcion inscripcion : inscripcionesElegibles) {
            if (inscripcion == null || inscripcion.getId() == null || valoracionEventoRepository.existsByInscripcionId(inscripcion.getId())) {
                continue;
            }

            ValoracionEvento valoracion = new ValoracionEvento();
            valoracion.setEvento(evento);
            valoracion.setInscripcion(inscripcion);
            valoracion.setVecino(inscripcion.getVecino());
            valoracion.setToken(generarTokenUnico());
            valoracion.setEstado(ESTADO_PENDIENTE);
            valoracion.setFechaGeneracion(ahora);
            valoracion.setFechaExpiracion(fechaExpiracion);

            try {
                valoracionEventoRepository.saveAndFlush(valoracion);
                generadas++;
            } catch (DataIntegrityViolationException exception) {
                log.info("Valoracion ya existente para inscripcion. inscripcionId={}", inscripcion.getId());
                continue;
            }

            if (enviarCorreoValoracion(inscripcion.getVecino(), evento, valoracion.getToken())) {
                correosEnviados++;
            }
        }

        return new ValoracionGeneracionResponse(evento.getId(), generadas, correosEnviados);
    }

    @Transactional
    public ValoracionTokenResponse obtenerValoracionPorToken(String token) {
        if (!StringUtils.hasText(token)) {
            return respuestaInvalida();
        }

        return valoracionEventoRepository.findByToken(token)
                .map(this::resolverEstadoToken)
                .orElseGet(this::respuestaInvalida);
    }

    @Transactional
    public ValoracionTokenResponse responderValoracion(String token, Integer puntuacion) {
        if (puntuacion == null || puntuacion < 1 || puntuacion > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La puntuacion debe estar entre 1 y 5");
        }

        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token de valoracion es obligatorio");
        }

        ValoracionEvento valoracion = valoracionEventoRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontro la valoracion solicitada"));

        if (estaRespondida(valoracion)) {
            return toTokenResponse(valoracion, ESTADO_RESPONDIDA, true, false);
        }

        if (estaExpirada(valoracion)) {
            valoracion.setEstado(ESTADO_EXPIRADA);
            valoracionEventoRepository.save(valoracion);
            return toTokenResponse(valoracion, ESTADO_EXPIRADA, false, true);
        }

        if (!ESTADO_PENDIENTE.equalsIgnoreCase(valoracion.getEstado())) {
            return resolverEstadoToken(valoracion);
        }

        valoracion.setPuntuacion(puntuacion.byteValue());
        valoracion.setEstado(ESTADO_RESPONDIDA);
        valoracion.setFechaRespuesta(ahoraLima());
        ValoracionEvento valoracionGuardada = valoracionEventoRepository.save(valoracion);

        return toTokenResponse(valoracionGuardada, ESTADO_RESPONDIDA, true, false);
    }

    private ValoracionTokenResponse resolverEstadoToken(ValoracionEvento valoracion) {
        if (estaRespondida(valoracion)) {
            return toTokenResponse(valoracion, ESTADO_RESPONDIDA, true, false);
        }

        if (estaExpirada(valoracion)) {
            valoracion.setEstado(ESTADO_EXPIRADA);
            valoracionEventoRepository.save(valoracion);
            return toTokenResponse(valoracion, ESTADO_EXPIRADA, false, true);
        }

        return toTokenResponse(valoracion, ESTADO_PENDIENTE, false, false);
    }

    private ValoracionTokenResponse toTokenResponse(ValoracionEvento valoracion, String estado, boolean yaRespondida, boolean expirada) {
        Evento evento = valoracion.getEvento();

        return new ValoracionTokenResponse(
                evento != null ? evento.getId() : null,
                evento != null ? evento.getTitulo() : null,
                evento != null ? toLocalDateTime(evento.getFechaHoraInicio()) : null,
                evento != null ? toLocalDateTime(evento.getFechaHoraFin()) : null,
                estado,
                yaRespondida,
                expirada
        );
    }

    private ValoracionTokenResponse respuestaInvalida() {
        return new ValoracionTokenResponse(null, null, null, null, ESTADO_INVALIDA, false, false);
    }

    private void validarEventoFinalizado(Evento evento) {
        String estadoCodigo = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";

        if (!"FINALIZADO".equals(estadoCodigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Solo se pueden generar valoraciones para eventos FINALIZADO"
            );
        }
    }

    private boolean encuestaSatisfaccionHabilitada(Evento evento) {
        return evento != null
                && evento.getEncuestaSatisfaccionHabilitado() != null
                && evento.getEncuestaSatisfaccionHabilitado() == 1;
    }

    private boolean enviarCorreoValoracion(Vecino vecino, Evento evento, String token) {
        if (vecino == null || !StringUtils.hasText(vecino.getEmail())) {
            return false;
        }

        try {
            vecinoNotificacionService.enviarCorreoValoracionEvento(
                    vecino.getEmail(),
                    vecino.getNombre(),
                    evento.getTitulo(),
                    token
            );
            return true;
        } catch (RuntimeException exception) {
            log.warn(
                    "No se pudo enviar correo de valoracion. eventoId={} vecinoId={}",
                    evento.getId(),
                    vecino.getId(),
                    exception
            );
            return false;
        }
    }

    private String generarTokenUnico() {
        String token;

        do {
            byte[] randomBytes = new byte[48];
            secureRandom.nextBytes(randomBytes);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        } while (valoracionEventoRepository.existsByToken(token));

        return token;
    }

    private boolean estaRespondida(ValoracionEvento valoracion) {
        return valoracion != null
                && (ESTADO_RESPONDIDA.equalsIgnoreCase(valoracion.getEstado())
                || ESTADO_RESPONDIDO_LEGACY.equalsIgnoreCase(valoracion.getEstado())
                || valoracion.getFechaRespuesta() != null);
    }

    private boolean estaExpirada(ValoracionEvento valoracion) {
        return valoracion.getFechaExpiracion() != null
                && valoracion.getFechaExpiracion().isBefore(ahoraLima());
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONA_LIMA);
    }

    private String valorDetalle(String valor) {
        return StringUtils.hasText(valor) ? valor.trim() : "Sin titulo";
    }
}