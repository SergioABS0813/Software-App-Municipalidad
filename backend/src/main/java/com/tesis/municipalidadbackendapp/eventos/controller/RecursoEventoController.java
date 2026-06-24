package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.dto.RecursoEventoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.RecursoUploadResponse;
import com.tesis.municipalidadbackendapp.eventos.service.RecursoEventoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/eventos")
public class RecursoEventoController {
    private final RecursoEventoService recursoEventoService;

    @PostMapping(value = "admin/operacion/{eventoId}/recursos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RecursoUploadResponse subirRecurso(
            @PathVariable Integer eventoId,
            @RequestParam String tipoRecurso,
            @RequestParam("archivo") MultipartFile archivo
    ) {
        return recursoEventoService.subirRecurso(eventoId, tipoRecurso, archivo);
    }

    @GetMapping("{eventoId}/recursos")
    public List<RecursoEventoDto> listarRecursos(@PathVariable Integer eventoId) {
        return recursoEventoService.listarRecursos(eventoId);
    }

    @DeleteMapping("admin/operacion/{eventoId}/recursos/{recursoId}")
    public ResponseEntity<Void> eliminarRecurso(
            @PathVariable Integer eventoId,
            @PathVariable Integer recursoId
    ) {
        recursoEventoService.eliminarRecurso(eventoId, recursoId);
        return ResponseEntity.noContent().build();
    }
}