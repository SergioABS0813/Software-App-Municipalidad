package com.tesis.municipalidadbackendapp.inscripciones.repository;

import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Integer> {

    List<Inscripcion> findByEventoId(Integer eventoId);

    Long countByEventoId(Integer eventoId);

    Optional<Inscripcion> findByEventoIdAndVecinoId(Integer eventoId, Integer vecinoId);

    @Query("""
        SELECT i
        FROM Inscripcion i
        JOIN FETCH i.evento e
        WHERE i.vecino.id = :vecinoId
        ORDER BY i.fechaInscripcion DESC
    """)
    List<Inscripcion> findDetalleByVecinoId(@Param("vecinoId") Integer vecinoId);

    @Query("""
        SELECT DISTINCT i
        FROM Inscripcion i
        JOIN FETCH i.evento e
        JOIN FETCH i.vecino v
        JOIN Asistencia a ON a.inscripcion = i
        LEFT JOIN ValoracionEvento valoracion ON valoracion.inscripcion = i
        WHERE e.id = :eventoId
          AND upper(a.estado) = 'VALIDADA'
          AND valoracion.id IS NULL
          AND v.email IS NOT NULL
          AND trim(v.email) <> ''
    """)
    List<Inscripcion> findElegiblesParaValoracion(@Param("eventoId") Integer eventoId);
}
