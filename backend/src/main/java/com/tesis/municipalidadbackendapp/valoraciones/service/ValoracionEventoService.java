package com.tesis.municipalidadbackendapp.valoraciones.service;

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
    private static final String ESTADO_RESPONDIDO = "RESPONDIDO";
    private static final String ESTADO_EXPIRADO = "EXPIRADO";
    private static final String ESTADO_INVALIDO = "INVALIDO";
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    private final EventoRepository eventoRepository;
    private final InscripcionRepository inscripcionRepository;
    private final ValoracionEventoRepository valoracionEventoRepository;
    private final VecinoNotificacionService vecinoNotificacionService;
    private final BitacoraAccionService bitacoraAccionService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public ValoracionGeneracionResponse generarValoracionesParaEventoFinalizado(
            Integer eventoId,
            Usuario usuario,
            HttpServletRequest request
    ) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        validarEventoFinalizado(evento);

        List<Inscripcion> inscripcionesElegibles = inscripcionRepository.findElegiblesParaValoracion(eventoId);
        Instant ahora = ahoraLima();
        Instant fechaExpiracion = ahora.plusSeconds(7L * 24L * 60L * 60L);
        int generadas = 0;
        int correosIntentados = 0;

        for (Inscripcion inscripcion : inscripcionesElegibles) {
            if (valoracionEventoRepository.existsByInscripcionId(inscripcion.getId())) {
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
                log.info(
                        "Valoracion ya existente para inscripcion. inscripcionId={}",
                        inscripcion.getId()
                );
                continue;
            }

            correosIntentados++;
            enviarCorreoValoracion(inscripcion.getVecino(), evento, valoracion.getToken());
        }

        if (usuario != null && request != null) {
            bitacoraAccionService.guardarAccion(
                    "GENERACION_VALORACIONES_EVENTO",
                    "EVENTO",
                    evento.getId(),
                    "Se generaron " + generadas + " valoraciones para el evento \"" + valorDetalle(evento.getTitulo()) + "\"",
                    usuario,
                    request
            );
        }

        return new ValoracionGeneracionResponse(eventoId, generadas, correosIntentados);
    }

    @Transactional
    public ValoracionTokenResponse validarToken(String token) {
        if (!StringUtils.hasText(token)) {
            return new ValoracionTokenResponse(null, null, null, ESTADO_INVALIDO);
        }

        return valoracionEventoRepository.findByToken(token)
                .map(this::resolverEstadoToken)
                .orElseGet(() -> new ValoracionTokenResponse(null, null, null, ESTADO_INVALIDO));
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No pudimos validar este enlace de valoracion"));

        if (ESTADO_RESPONDIDO.equals(valoracion.getEstado())) {
            return toTokenResponse(valoracion, ESTADO_RESPONDIDO);
        }

        if (estaExpirada(valoracion)) {
            valoracion.setEstado(ESTADO_EXPIRADO);
            valoracionEventoRepository.save(valoracion);
            return toTokenResponse(valoracion, ESTADO_EXPIRADO);
        }

        valoracion.setPuntuacion(puntuacion.byteValue());
        valoracion.setEstado(ESTADO_RESPONDIDO);
        valoracion.setFechaRespuesta(ahoraLima());
        ValoracionEvento valoracionGuardada = valoracionEventoRepository.save(valoracion);

        return toTokenResponse(valoracionGuardada, ESTADO_RESPONDIDO);
    }

    private ValoracionTokenResponse resolverEstadoToken(ValoracionEvento valoracion) {
        if (ESTADO_RESPONDIDO.equals(valoracion.getEstado())) {
            return toTokenResponse(valoracion, ESTADO_RESPONDIDO);
        }

        if (estaExpirada(valoracion)) {
            valoracion.setEstado(ESTADO_EXPIRADO);
            valoracionEventoRepository.save(valoracion);
            return toTokenResponse(valoracion, ESTADO_EXPIRADO);
        }

        return toTokenResponse(valoracion, valoracion.getEstado());
    }

    private ValoracionTokenResponse toTokenResponse(ValoracionEvento valoracion, String estado) {
        Evento evento = valoracion.getEvento();

        return new ValoracionTokenResponse(
                evento.getId(),
                evento.getTitulo(),
                toLocalDateTime(evento.getFechaHoraInicio()),
                estado
        );
    }

    private void validarEventoFinalizado(Evento evento) {
        String estadoCodigo = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";

        if (!"FINALIZADO".equals(estadoCodigo) && !"CERRADO".equals(estadoCodigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Solo se pueden generar valoraciones para eventos FINALIZADO o CERRADO"
            );
        }
    }

    private void enviarCorreoValoracion(Vecino vecino, Evento evento, String token) {
        try {
            vecinoNotificacionService.enviarCorreoValoracionEvento(
                    vecino.getEmail(),
                    vecino.getNombre(),
                    evento.getTitulo(),
                    token
            );
        } catch (RuntimeException exception) {
            log.warn(
                    "No se pudo enviar correo de valoracion. eventoId={} vecinoId={}",
                    evento.getId(),
                    vecino.getId(),
                    exception
            );
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

    private boolean estaExpirada(ValoracionEvento valoracion) {
        return valoracion.getFechaExpiracion() != null
                && valoracion.getFechaExpiracion().isBefore(ahoraLima());
    }

    private Instant ahoraLima() {
        return LocalDateTime.now(ZONA_LIMA).atZone(ZONA_LIMA).toInstant();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONA_LIMA);
    }

    private String valorDetalle(String valor) {
        return StringUtils.hasText(valor) ? valor.trim() : "Sin titulo";
    }
}
