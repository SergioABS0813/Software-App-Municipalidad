package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import com.tesis.municipalidadbackendapp.eventos.service.EstadoEventoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/estado_evento")
public class EstadoEventoController {
    private final EstadoEventoService estadoEventoService;

    @GetMapping("admin/operacion")
    public List<EstadoEvento> obtenerEstadosEvento(){
        return estadoEventoService.obtenerEstadosEvento();
    }
}
