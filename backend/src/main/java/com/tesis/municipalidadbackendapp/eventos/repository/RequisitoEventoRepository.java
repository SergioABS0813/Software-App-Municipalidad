package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.RequisitoEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequisitoEventoRepository extends JpaRepository<RequisitoEvento, Integer> {

    List<RequisitoEvento> findByEvento(Evento evento);
}
