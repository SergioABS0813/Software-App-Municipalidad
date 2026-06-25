package com.tesis.municipalidadbackendapp.inscripciones.service;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.inscripciones.dto.InscripcionEventoResponse;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.VecinoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class InscripcionEventoService {

    private final InscripcionRepository inscripcionRepository;
    private final EventoRepository eventoRepository;
    private final VecinoRepository vecinoRepository;

    @Transactional
    public InscripcionEventoResponse inscribirEvento(Integer eventoId) {
        Vecino vecino = obtenerVecinoAutenticado();
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        String estadoEvento = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";
        if (!"PUBLICADO".equals(estadoEvento)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El evento no esta disponible para inscripcion");
        }

        return inscripcionRepository.findByEventoIdAndVecinoId(eventoId, vecino.getId())
                .map(inscripcion -> toResponse(inscripcion, "YA_INSCRITO"))
                .orElseGet(() -> registrarNuevaInscripcion(evento, vecino));
    }

    private InscripcionEventoResponse registrarNuevaInscripcion(Evento evento, Vecino vecino) {
        Integer aforoMaximo = evento.getAforoMaximo();
        if (aforoMaximo != null && aforoMaximo > 0) {
            long totalInscritos = inscripcionRepository.countByEventoId(evento.getId());
            if (totalInscritos >= aforoMaximo) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El evento ya no tiene cupos disponibles");
            }
        }

        Instant ahora = Instant.now();
        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setEvento(evento);
        inscripcion.setVecino(vecino);
        inscripcion.setFechaInscripcion(ahora);
        inscripcion.setOrigenInscripcion("PORTAL_PUBLICO");
        inscripcion.setCodigoInscripcion(generarCodigoInscripcion(evento, vecino, ahora));

        return toResponse(inscripcionRepository.save(inscripcion), "INSCRITO");
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

    private InscripcionEventoResponse toResponse(Inscripcion inscripcion, String estado) {
        return new InscripcionEventoResponse(
                inscripcion.getId(),
                inscripcion.getEvento().getId(),
                inscripcion.getEvento().getTitulo(),
                inscripcion.getVecino().getId(),
                inscripcion.getVecino().getNombre(),
                inscripcion.getCodigoInscripcion(),
                inscripcion.getFechaInscripcion(),
                estado
        );
    }
}
