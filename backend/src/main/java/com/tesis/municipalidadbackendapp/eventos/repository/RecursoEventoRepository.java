package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.RecursoEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecursoEventoRepository extends JpaRepository<RecursoEvento, Integer> {

    List<RecursoEvento> findByEvento(Evento evento);
}
