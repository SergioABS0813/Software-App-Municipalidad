package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.AgendaEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface AgendaEventoRepository extends JpaRepository<AgendaEvento, Integer> {

    List<AgendaEvento> findByEvento(Evento evento);
}
