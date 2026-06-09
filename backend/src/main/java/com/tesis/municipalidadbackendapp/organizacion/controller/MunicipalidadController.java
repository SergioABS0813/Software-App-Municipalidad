package com.tesis.municipalidadbackendapp.organizacion.controller;

import com.tesis.municipalidadbackendapp.organizacion.entity.Municipalidad;
import com.tesis.municipalidadbackendapp.organizacion.service.MunicipalidadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/municipalidad")
public class MunicipalidadController {

    private final MunicipalidadService municipalidadService;

    @GetMapping("principal")
    public Municipalidad obtenerMunicipalidad() {
        return municipalidadService.obtenerMunicipalidadPrincipal();
    }




}
