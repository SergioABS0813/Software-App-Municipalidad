package com.tesis.municipalidadbackendapp.vecinos.service;

import com.tesis.municipalidadbackendapp.vecinos.dto.EstadoVecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.entity.EstadoVecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.EstadoVecinoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstadoVecinoService {
    private final EstadoVecinoRepository estadoVecinoRepository;

    public List<EstadoVecinoDirectorioDto>  obtenerEstadosVecinos(){
        return estadoVecinoRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
    }

    private EstadoVecinoDirectorioDto mapToDto(EstadoVecino estadoVecino){
        return new EstadoVecinoDirectorioDto(estadoVecino.getId(),
                estadoVecino.getNombre());
    }
}
