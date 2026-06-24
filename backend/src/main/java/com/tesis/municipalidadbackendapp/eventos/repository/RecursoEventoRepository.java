package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.RecursoEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecursoEventoRepository extends JpaRepository<RecursoEvento, Integer> {
    List<RecursoEvento> findByEvento(Evento evento);

    List<RecursoEvento> findByEventoId(Integer eventoId);

    Optional<RecursoEvento> findByIdAndEventoId(Integer id, Integer eventoId);

    List<RecursoEvento> findByEventoAndTipoRecurso(Evento evento, String tipoRecurso);
}