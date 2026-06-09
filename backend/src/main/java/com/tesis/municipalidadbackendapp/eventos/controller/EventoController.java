package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.dto.EventoPanelAdministrativoDto;
import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.eventos.service.EventoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor //Crea el constructor para atributos final
@RequestMapping("api/eventos") //Ruta base del controller
public class EventoController {

    private final EventoService eventoService;

    @GetMapping("admin/operacion")
    public List<EventoPanelAdministrativoDto> eventosPanelAdministrativo() {
        return eventoService.obtenerEventosPanelAdministrativo();
    }





}
