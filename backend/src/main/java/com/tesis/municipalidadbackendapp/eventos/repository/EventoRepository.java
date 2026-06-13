package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.ZonedDateTime;

public interface EventoRepository extends JpaRepository<Evento, Integer> {

    Integer countByEstadoEvento_CodigoAndFechaHoraFinGreaterThanEqual(
            String codigo,
            ZonedDateTime ahora
    );

    Integer countByEstadoEventoCodigo(String codigo);

    Long countByUbicacionId(Integer ubicacionId);

}
