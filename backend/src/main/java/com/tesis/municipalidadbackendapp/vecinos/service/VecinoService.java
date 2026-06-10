package com.tesis.municipalidadbackendapp.vecinos.service;

import com.tesis.municipalidadbackendapp.vecinos.dto.EstadoVecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.VecinoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VecinoService {

    private final VecinoRepository vecinoRepository;

    public List<VecinoDirectorioDto> obtenerTodosVecinos() {
        return vecinoRepository.findAll().stream()
                .map(vecino -> new VecinoDirectorioDto(
                        vecino.getId(),
                        vecino.getNombre(),
                        vecino.getDni(),
                        vecino.getEmail(),
                        new EstadoVecinoDirectorioDto(
                                vecino.getEstadoVecino().getId(),
                                vecino.getEstadoVecino().getNombre()
                        )
                ))
                .toList();
    }

    public Page<VecinoDirectorioDto> listarDirectorio(String texto, Integer estadoId, Pageable pageable) {
        return vecinoRepository.buscarDirectorio(texto, estadoId, pageable)
                .map(this::mapToDirectorioDto);
    }

    private VecinoDirectorioDto mapToDirectorioDto(Vecino vecino) {
        EstadoVecinoDirectorioDto estadoVecinoDto = new EstadoVecinoDirectorioDto(
                vecino.getEstadoVecino().getId(),
                vecino.getEstadoVecino().getNombre()
        );
        return new VecinoDirectorioDto(
                vecino.getId(),
                vecino.getNombre(),
                vecino.getDni(),
                vecino.getEmail(),
                estadoVecinoDto
        );
    }



}
