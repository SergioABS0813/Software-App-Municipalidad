package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.eventos.dto.EventoPanelAdministrativoDto;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.ObservacionEvento;
import com.tesis.municipalidadbackendapp.eventos.repository.*;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor //Crea el constructor para los atributos final
public class EventoService {

    private final EventoRepository eventoRepository;
    private final ObservacionEventoRepository observacionEventoRepository;
    private final RequisitoEventoRepository requisitoEventoRepository;
    private final AgendaEventoRepository agendaEventoRepository;
    private final RecursoEventoRepository recursoEventoRepository;

    public List<EventoPanelAdministrativoDto> obtenerEventosPanelAdministrativo() {
        List<Evento> eventos = eventoRepository.findAll();
        return eventos.stream().map(evento -> new EventoPanelAdministrativoDto(
                evento.getId(),
                evento.getTitulo(),
                toLocalDateTime(evento.getFechaHoraInicio()),
                evento.getUbicacion().getNombre(),
                evento.getEstadoEvento().getCodigo(),
                new EventoPanelAdministrativoDto.CategoriaEventoPanelAdministrativoDto(
                        evento.getCategoria().getId(),
                        evento.getCategoria().getNombre()
                ),
                calcularCompletitud(evento),
                construirAlertasFichaEventoPanelAdministrativoDto(evento)
        )).toList();
    }

    public Integer obtenerNumeroEventosActivosDesdeHoy() {
        ZonedDateTime ahora = ZonedDateTime.now(ZoneId.of("America/Lima"));
        return eventoRepository.countByEstadoEvento_CodigoAndFechaHoraFinGreaterThanEqual(
                "PUBLICADO",
                ahora
        );
    }

    public Integer obtenerNumeroEventosBorradores(){
        return eventoRepository.countByEstadoEventoCodigo("BORRADOR");
    }

    public Integer obtenerNumeroEventosParaRevision(){
        return eventoRepository.countByEstadoEventoCodigo("PARA_REVISION");
    }

    public Integer obtenerNumeroEventosObservados(){
        return eventoRepository.countByEstadoEventoCodigo("OBSERVADO");
    }

    private Integer calcularCompletitud(Evento evento) {
        if (evento == null) {
            return 0;
        }

        int total = 6; //Son 6 partes para colocar información sí o sí del evento
        int completos = 0;

        //Parte 1:Datos generales (1/6)
        if (hasText(evento.getTitulo()) && hasText(evento.getDescripcion()) && evento.getAreaMunicipal() != null && hasText(evento.getDescripcionBreve()) && evento.getCategoria() != null) completos++;
        //Parte 2:Programación (2/6)
        if (evento.getFechaHoraInicio() != null && evento.getFechaHoraFin() != null && evento.getCostoReferencial() != null) completos++;
        //Parte 3:Agenda (3/6)
        boolean tieneAgenda = agendaEventoRepository.findByEvento(evento).size() != 0;
        if (tieneAgenda) completos++;
        //Parte 4: Requisitos (4/6)
        boolean tieneRequisitos = requisitoEventoRepository.findByEvento(evento).size() != 0;
        if (tieneRequisitos) completos++;
        //Parte 5: Ubicación (5/6)
        if (evento.getUbicacion() != null) completos++;
        //Parte 6: Recursos Adjuntos (6/6)
        boolean tieneRecursos = recursoEventoRepository.findByEvento(evento).size() != 0;
        if (tieneRecursos) completos++;

        return Math.round((completos * 100f) / total);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }

    private List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> construirAlertasFichaEventoPanelAdministrativoDto(Evento evento) {
        if (evento == null) {
            return List.of();
        }

        List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas = new ArrayList<>();

        agregarAlertasObservacionesDirectivo(evento, alertas);
        agregarAlertasCamposPendientes(evento, alertas);

        return alertas;
    }

    private void agregarAlertasObservacionesDirectivo(
            Evento evento,
            List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas
    ) {
        if (evento.getId() == null) {
            return;
        }

        long numeroObservacionesPendientes = observacionEventoRepository.findByEventoId(evento.getId()).stream()
                .filter(this::esObservacionPendiente)
                .count();

        if(numeroObservacionesPendientes>0){
            alertas.add(new EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto(
                    "OBSERVACION_DIRECTIVO",
                    numeroObservacionesPendientes == 1 ? "1 observación del directivo": numeroObservacionesPendientes + "observaciones del directivo."));

        }
    }

    private boolean esObservacionPendiente(ObservacionEvento observacion) { //Los únicos estados que tiene observación son: ATENDIDA y PENDIENTE
        if (observacion == null || observacion.getEstado().equals("ATENDIDA")) {
            return false;
        } else if (observacion.getEstado().equals("PENDIENTE") || !hasText(observacion.getEstado())) {
            return true;
        }
        else {
            return true;
        }
    }

    private void agregarAlertasCamposPendientes(
            Evento evento,
            List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas
    ) {

        //Parte 1:Datos generales (1/6)
        if (!hasText(evento.getTitulo()) || !hasText(evento.getDescripcion()) || evento.getAreaMunicipal() == null || !hasText(evento.getDescripcionBreve()) || evento.getCategoria() == null){
            agregarAlertaCampoPendiente(alertas, "Completar datos generales del evento");
        }
        //Parte 2:Programación (2/6)
        if (evento.getFechaHoraInicio() == null || evento.getFechaHoraFin() == null || evento.getCostoReferencial() == null){
            agregarAlertaCampoPendiente(alertas, "Completar programación del evento");

        }
        //Parte 3:Agenda (3/6)
        boolean tieneAgenda = agendaEventoRepository.findByEvento(evento).size() != 0;
        if (!tieneAgenda) {
            agregarAlertaCampoPendiente(alertas, "Definir agenda del evento");
        }
        //Parte 4: Requisitos (4/6)
        boolean tieneRequisitos = requisitoEventoRepository.findByEvento(evento).size() != 0;
        if (!tieneRequisitos) {
            agregarAlertaCampoPendiente(alertas, "Definir requisitos del evento");
        }
        //Parte 5: Ubicación (5/6)
        if (evento.getUbicacion() == null){
            agregarAlertaCampoPendiente(alertas, "Agregar ubicación del evento");
        }
        //Parte 6: Recursos Adjuntos (6/6)
        boolean tieneRecursos = recursoEventoRepository.findByEvento(evento).size() != 0;
        if (!tieneRecursos){
            agregarAlertaCampoPendiente(alertas, "Agregar recursos del evento");
        }

    }

    private void agregarAlertaCampoPendiente(
            List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas,
            String mensaje
    ) {
        alertas.add(new EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto(
                "CAMPO_PENDIENTE",
                mensaje
        ));
    }


}
