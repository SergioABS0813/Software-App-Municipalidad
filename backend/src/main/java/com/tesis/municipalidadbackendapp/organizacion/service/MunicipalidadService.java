package com.tesis.municipalidadbackendapp.organizacion.service;

import com.tesis.municipalidadbackendapp.organizacion.entity.Municipalidad;
import com.tesis.municipalidadbackendapp.organizacion.repository.MunicipalidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MunicipalidadService {

    private final MunicipalidadRepository municipalidadRepository;

    public Municipalidad obtenerMunicipalidadPrincipal() {
        return municipalidadRepository.findById(1).orElseThrow(() -> new RuntimeException("Municipalidad no encontrada"));
    }
}
