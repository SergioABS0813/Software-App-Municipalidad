package com.tesis.municipalidadbackendapp.asistencias.repository;

import com.tesis.municipalidadbackendapp.asistencias.entity.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Integer> {

    @Query("""
        SELECT a
        FROM Asistencia a
        JOIN FETCH a.inscripcion i
        WHERE i.id IN :inscripcionIds
    """)
    List<Asistencia> findByInscripcionIdIn(@Param("inscripcionIds") Collection<Integer> inscripcionIds);
}
