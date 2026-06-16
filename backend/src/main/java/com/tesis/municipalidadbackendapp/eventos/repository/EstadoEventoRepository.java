package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoEventoRepository extends JpaRepository<EstadoEvento,Integer> {
    Optional<EstadoEvento> findByCodigo(String codigo);
}
