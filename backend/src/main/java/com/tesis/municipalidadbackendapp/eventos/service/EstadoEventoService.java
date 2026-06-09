package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import com.tesis.municipalidadbackendapp.eventos.repository.EstadoEventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstadoEventoService {
    private final EstadoEventoRepository estadoEventoRepository;


    public List<EstadoEvento> obtenerEstadosEvento() {
        return estadoEventoRepository.findAll();
    }




}
