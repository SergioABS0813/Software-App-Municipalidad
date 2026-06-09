package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstadoEventoRepository extends JpaRepository<EstadoEvento,Integer> {
}
