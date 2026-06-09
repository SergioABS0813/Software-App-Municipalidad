package com.tesis.municipalidadbackendapp.organizacion.controller;

import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.organizacion.service.AreaMunicipalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/area_municipal")
public class AreaMunicipalController {

    private final AreaMunicipalService areaMunicipalService;

    @GetMapping("obtener_areas_municipales")
    public List<AreaMunicipal> obtenerAreasMunicipales(){
        return areaMunicipalService.obtenerAreasMunicipales();
    }

}
