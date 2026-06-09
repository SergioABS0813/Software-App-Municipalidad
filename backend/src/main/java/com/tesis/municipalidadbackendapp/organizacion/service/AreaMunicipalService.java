package com.tesis.municipalidadbackendapp.organizacion.service;

import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.organizacion.repository.AreaMunicipalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AreaMunicipalService {
    private final AreaMunicipalRepository areaMunicipalRepository;

    public List<AreaMunicipal> obtenerAreasMunicipales() {
        return areaMunicipalRepository.findAll();
    }

    public AreaMunicipal obtenerAreaMunicipalporId(Integer id) {
        return areaMunicipalRepository.findById(id).orElse(null);
    }
}
