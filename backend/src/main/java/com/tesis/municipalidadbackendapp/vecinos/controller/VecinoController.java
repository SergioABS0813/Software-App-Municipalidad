package com.tesis.municipalidadbackendapp.vecinos.controller;

import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/vecino")
public class VecinoController {

    private final VecinoService vecinoService;

    @GetMapping("admin/obtener_vecinos")
    public List<VecinoDirectorioDto> obtenerVecinos(){
        return vecinoService.obtenerTodosVecinos();
    }

    // así consume react: GET /api/vecinos/page?texto=sergio&estadoId=1&page=0&size=10
    @GetMapping("page")
    public Page<VecinoDirectorioDto> listarDirectorio(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer estadoId,
            @PageableDefault(size = 10, sort = "nombre") Pageable pageable
    ) {
        return vecinoService.listarDirectorio(texto, estadoId, pageable);
    }

}
