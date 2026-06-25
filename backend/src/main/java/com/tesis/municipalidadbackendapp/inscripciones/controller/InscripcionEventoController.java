package com.tesis.municipalidadbackendapp.inscripciones.controller;

import com.tesis.municipalidadbackendapp.inscripciones.dto.InscripcionEventoResponse;
import com.tesis.municipalidadbackendapp.inscripciones.service.InscripcionEventoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/inscripciones")
public class InscripcionEventoController {

    private final InscripcionEventoService inscripcionEventoService;

    @PostMapping("eventos/{eventoId}")
    public InscripcionEventoResponse inscribirEvento(@PathVariable Integer eventoId) {
        return inscripcionEventoService.inscribirEvento(eventoId);
    }
}
