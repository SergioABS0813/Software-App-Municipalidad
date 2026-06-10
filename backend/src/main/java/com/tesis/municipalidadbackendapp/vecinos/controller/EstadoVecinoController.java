package com.tesis.municipalidadbackendapp.vecinos.controller;

import com.tesis.municipalidadbackendapp.vecinos.dto.EstadoVecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.entity.EstadoVecino;
import com.tesis.municipalidadbackendapp.vecinos.service.EstadoVecinoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/estado_vecino")
public class EstadoVecinoController {

    private final EstadoVecinoService estadoVecinoService;

    @GetMapping("obtener_estados")
    public List<EstadoVecinoDirectorioDto> obtenerEstados(){
        return estadoVecinoService.obtenerEstadosVecinos();
    }

}
