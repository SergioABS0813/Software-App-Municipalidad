package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.dto.EventoOperativoHoyDto;
import com.tesis.municipalidadbackendapp.eventos.service.EventoOperativoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/operativo/eventos")
public class OperativoEventoController {

    private final EventoOperativoService eventoOperativoService;

    @GetMapping("hoy")
    public List<EventoOperativoHoyDto> listarEventosHoy() {
        return eventoOperativoService.listarEventosHoyParaOperativo();
    }
}
