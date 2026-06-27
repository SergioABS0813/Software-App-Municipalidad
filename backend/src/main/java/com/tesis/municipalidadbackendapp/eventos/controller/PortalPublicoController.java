package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaPublicaDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoPortalPublicoDto;
import com.tesis.municipalidadbackendapp.eventos.service.CategoriaService;
import com.tesis.municipalidadbackendapp.eventos.service.EventoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/public")
public class PortalPublicoController {

    private final EventoService eventoService;
    private final CategoriaService categoriaService;

    @GetMapping("eventos")
    public Page<EventoPortalPublicoDto> obtenerEventosPublicados(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer categoriaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        return eventoService.obtenerEventosPortalPublico(texto, categoriaId, page, size);
    }

    @GetMapping("eventos/proximo")
    public EventoPortalPublicoDto obtenerProximoEventoPublicado() {
        return eventoService.obtenerProximoEventoPortalPublico();
    }

    @GetMapping("categorias")
    public List<CategoriaPublicaDto> obtenerCategoriasPublicas() {
        return categoriaService.obtenerCategoriasPublicas();
    }
}
