package com.tesis.municipalidadbackendapp.organizacion.service;

import com.tesis.municipalidadbackendapp.organizacion.dto.AreaMunicipalDto;
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

    // Solo áreas municipales que pueden organizar eventos
    public List<AreaMunicipalDto> obtenerAreasMunicipales() {
        return areaMunicipalRepository.findByOrganizarEventosTrue().stream()
                .map(this::mapToDto)
                .toList();
    }

    public AreaMunicipal obtenerAreaMunicipalporId(Integer id) {
        return areaMunicipalRepository.findById(id).orElse(null);
    }

    private AreaMunicipalDto mapToDto(AreaMunicipal areaMunicipal) {
        return new AreaMunicipalDto(
                areaMunicipal.getId(),
                areaMunicipal.getNombre(),
                areaMunicipal.getTipoArea()
        );
    }
}
