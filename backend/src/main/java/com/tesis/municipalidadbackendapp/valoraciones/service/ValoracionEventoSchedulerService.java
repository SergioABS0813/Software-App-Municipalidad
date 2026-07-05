package com.tesis.municipalidadbackendapp.valoraciones.service;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.valoraciones.dto.ValoracionGeneracionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ValoracionEventoSchedulerService {
    private final EventoRepository eventoRepository;
    private final ValoracionEventoService valoracionEventoService;

    @Scheduled(fixedDelayString = "${app.valoraciones.scheduler.fixed-delay-ms:300000}")
    public void generarValoracionesEventosFinalizados() {
        log.info("Inicio scheduler de valoraciones de eventos finalizados.");

        List<Evento> eventos = eventoRepository.findEventosFinalizadosConEncuestaSatisfaccionHabilitada();
        log.info("Eventos finalizados con encuesta habilitada encontrados: {}", eventos.size());

        int totalGeneradas = 0;
        int totalCorreosEnviados = 0;

        for (Evento evento : eventos) {
            try {
                ValoracionGeneracionResponse response = valoracionEventoService.generarValoracionesParaEvento(evento);
                totalGeneradas += response.valoracionesGeneradas();
                totalCorreosEnviados += response.correosIntentados();
            } catch (RuntimeException exception) {
                log.warn("No se pudieron generar valoraciones para eventoId={}", evento.getId(), exception);
            }
        }

        log.info(
                "Fin scheduler de valoraciones. eventos={}, valoracionesGeneradas={}, correosEnviados={}",
                eventos.size(),
                totalGeneradas,
                totalCorreosEnviados
        );
    }
}