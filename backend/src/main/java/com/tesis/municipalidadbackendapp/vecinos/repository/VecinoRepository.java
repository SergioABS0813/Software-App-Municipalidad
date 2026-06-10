package com.tesis.municipalidadbackendapp.vecinos.repository;

import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VecinoRepository extends JpaRepository<Vecino, Integer> {

    @Query("""
        SELECT v
        FROM Vecino v
        WHERE (:texto IS NULL OR :texto = ''
            OR LOWER(v.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR v.dni LIKE CONCAT('%', :texto, '%')
            OR LOWER(v.email) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
        AND (:estadoId IS NULL OR v.estadoVecino.id = :estadoId)
        ORDER BY v.nombre ASC
    """)
    Page<Vecino> buscarDirectorio(
            @Param("texto") String texto,
            @Param("estadoId") Integer estadoId,
            Pageable pageable
    );

}
