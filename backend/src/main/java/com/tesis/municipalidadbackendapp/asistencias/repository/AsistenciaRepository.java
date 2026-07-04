package com.tesis.municipalidadbackendapp.asistencias.repository;

import com.tesis.municipalidadbackendapp.asistencias.entity.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Integer> {

    @Query("""
        SELECT a
        FROM Asistencia a
        JOIN FETCH a.inscripcion i
        WHERE i.id IN :inscripcionIds
    """)
    List<Asistencia> findByInscripcionIdIn(@Param("inscripcionIds") Collection<Integer> inscripcionIds);

    Optional<Asistencia> findByInscripcionId(Integer inscripcionId);

    @Query("""
        SELECT a
        FROM Asistencia a
        JOIN FETCH a.inscripcion i
        JOIN FETCH i.vecino v
        LEFT JOIN FETCH a.validadoPorUsuario u
        WHERE i.evento.id = :eventoId
        ORDER BY a.id DESC
    """)
    List<Asistencia> findTrazabilidadByEventoId(@Param("eventoId") Integer eventoId);

    @Query("""
        SELECT a
        FROM Asistencia a
        JOIN FETCH a.inscripcion i
        JOIN FETCH i.evento e
        JOIN FETCH i.vecino v
        LEFT JOIN FETCH a.validadoPorUsuario u
        WHERE e.id = :eventoId
          AND a.id = :asistenciaId
    """)
    Optional<Asistencia> findOperativaByEventoIdAndId(
            @Param("eventoId") Integer eventoId,
            @Param("asistenciaId") Integer asistenciaId
    );
}
