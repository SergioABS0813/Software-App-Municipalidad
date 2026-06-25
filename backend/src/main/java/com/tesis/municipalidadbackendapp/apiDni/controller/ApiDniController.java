package com.tesis.municipalidadbackendapp.apiDni.controller;

import com.tesis.municipalidadbackendapp.apiDni.dto.BackendResponseDto;
import com.tesis.municipalidadbackendapp.apiDni.service.ApiDniService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/consulta_dni")
public class ApiDniController {

    private final ApiDniService apiDniService;

    @GetMapping("{dni}")
    public ResponseEntity<BackendResponseDto> getNombrePorDni(@PathVariable String dni) {
        BackendResponseDto response = apiDniService.obtenerNombrePorDni(dni);
        return ResponseEntity.ok(response);
    }


}
