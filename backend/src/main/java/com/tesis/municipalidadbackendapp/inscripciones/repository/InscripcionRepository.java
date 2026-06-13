package com.tesis.municipalidadbackendapp.inscripciones.repository;

import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Integer> {

    @Query("""
        SELECT i
        FROM Inscripcion i
        JOIN FETCH i.evento e
        WHERE i.vecino.id = :vecinoId
        ORDER BY i.fechaInscripcion DESC
    """)
    List<Inscripcion> findDetalleByVecinoId(@Param("vecinoId") Integer vecinoId);
}
