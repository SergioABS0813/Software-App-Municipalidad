package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.repository.EstadoEventoRepository;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventoEstadoProgramadoService {
    private final EventoRepository eventoRepository;
    private final EstadoEventoRepository estadoEventoRepository;

    @Scheduled(fixedDelayString = "${app.eventos.estados.en-curso.fixed-delay-ms:60000}")
    @Transactional
    public void marcarEventosEnCurso() {
        EstadoEvento estadoEnCurso = estadoEventoRepository.findByCodigo("EN_CURSO")
                .orElse(null);
        if (estadoEnCurso == null) {
            log.warn("No se encontro estado EN_CURSO; no se actualizaron eventos en curso.");
            return;
        }

        Instant ahora = Instant.now();
        List<Evento> eventos = eventoRepository.findEventosPublicadosParaMarcarEnCurso(ahora);
        for (Evento evento : eventos) {
            evento.setEstadoEvento(estadoEnCurso);
            evento.setTiempoActualizado(ahora);
            evento.setEventoActualizadoEn(ahora);
        }
    }
}