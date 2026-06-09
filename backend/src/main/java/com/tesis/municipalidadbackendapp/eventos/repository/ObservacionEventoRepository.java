package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.ObservacionEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObservacionEventoRepository extends JpaRepository<ObservacionEvento, Integer> {

    List<ObservacionEvento> findByEventoId(Integer eventoId);
}
