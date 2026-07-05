package com.tesis.municipalidadbackendapp.eventos.service;

import static com.tesis.municipalidadbackendapp.common.FechaHoraUtils.ahoraLima;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.EventoOperativo;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoOperativoRepository;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.enums.EstadoInscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.UsuarioNotificacionService;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoNotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventoRecordatorioService {
    private static final Duration ANTICIPACION_RECORDATORIO = Duration.ofHours(1);
    private static final Duration MARGEN_BUSQUEDA = Duration.ofMinutes(5);

    private final EventoRepository eventoRepository;
    private final InscripcionRepository inscripcionRepository;
    private final EventoOperativoRepository eventoOperativoRepository;
    private final VecinoNotificacionService vecinoNotificacionService;
    private final UsuarioNotificacionService usuarioNotificacionService;

    @Scheduled(fixedDelayString = "${app.eventos.recordatorios.una-hora.fixed-delay-ms:300000}")
    @Transactional
    public void enviarRecordatoriosUnaHoraAntes() {
        Instant ahora = ahoraLima();
        Instant inicioVentana = ahora.plus(ANTICIPACION_RECORDATORIO).minus(MARGEN_BUSQUEDA);
        Instant finVentana = ahora.plus(ANTICIPACION_RECORDATORIO).plus(MARGEN_BUSQUEDA);
        List<Evento> eventos = eventoRepository.findEventosParaRecordatorioUnaHora(inicioVentana, finVentana);

        for (Evento evento : eventos) {
            enviarRecordatorioEvento(evento, ahora);
        }
    }

    private void enviarRecordatorioEvento(Evento evento, Instant enviadoEn) {
        List<Inscripcion> inscripciones = inscripcionRepository.findConfirmadasConVecinoParaRecordatorio(
                evento.getId(),
                EstadoInscripcion.CONFIRMADA
        );
        Set<String> correosVecinosEnviados = new HashSet<>();
        for (Inscripcion inscripcion : inscripciones) {
            String email = inscripcion.getVecino() != null ? inscripcion.getVecino().getEmail() : null;
            if (email != null && correosVecinosEnviados.add(email.trim().toLowerCase())) {
                vecinoNotificacionService.enviarRecordatorioEventoUnaHora(inscripcion);
            }
        }

        List<EventoOperativo> operativos = eventoOperativoRepository.findActivosConUsuarioParaRecordatorio(evento.getId());
        Set<String> correosOperativosEnviados = new HashSet<>();
        for (EventoOperativo operativo : operativos) {
            String email = operativo.getUsuario() != null ? operativo.getUsuario().getEmail() : null;
            if (email != null && correosOperativosEnviados.add(email.trim().toLowerCase())) {
                usuarioNotificacionService.enviarRecordatorioEventoUnaHora(operativo.getUsuario(), evento);
            }
        }

        evento.setRecordatorioUnaHoraEnviadoEn(enviadoEn);
        eventoRepository.save(evento);
        log.info(
                "Recordatorio de una hora enviado para eventoId={}, vecinos={}, operativos={}",
                evento.getId(),
                correosVecinosEnviados.size(),
                correosOperativosEnviados.size()
        );
    }
}
