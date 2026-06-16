package com.tesis.municipalidadbackendapp.valoraciones.repository;

import com.tesis.municipalidadbackendapp.valoraciones.entity.ValoracionEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ValoracionEventoRepository extends JpaRepository<ValoracionEvento, Integer> {
    boolean existsByInscripcionId(Integer inscripcionId);

    boolean existsByToken(String token);

    Optional<ValoracionEvento> findByToken(String token);

    List<ValoracionEvento> findByEventoId(Integer eventoId);

    @Query("""
            select avg(valoracion.puntuacion)
            from ValoracionEvento valoracion
            where valoracion.evento.id = :eventoId
              and valoracion.estado = 'RESPONDIDO'
              and valoracion.puntuacion is not null
            """)
    Double promedioPuntuacionPorEvento(@Param("eventoId") Integer eventoId);
}
