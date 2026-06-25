package com.tesis.municipalidadbackendapp.vecinos.repository;

import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

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

    @Query(
            value = """
                SELECT v
                FROM Vecino v
                JOIN FETCH v.estadoVecino ev
                WHERE (:texto IS NULL OR :texto = ''
                    OR LOWER(v.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
                    OR v.dni LIKE CONCAT('%', :texto, '%')
                    OR LOWER(v.email) LIKE LOWER(CONCAT('%', :texto, '%'))
                )
                AND (:estado IS NULL OR :estado = '' OR ev.nombre = :estado)
                AND ev.nombre IN ('PENDIENTE_CONFIRMACION', 'INACTIVO', 'ACTIVO')
            """,
            countQuery = """
                SELECT COUNT(v)
                FROM Vecino v
                JOIN v.estadoVecino ev
                WHERE (:texto IS NULL OR :texto = ''
                    OR LOWER(v.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
                    OR v.dni LIKE CONCAT('%', :texto, '%')
                    OR LOWER(v.email) LIKE LOWER(CONCAT('%', :texto, '%'))
                )
                AND (:estado IS NULL OR :estado = '' OR ev.nombre = :estado)
                AND ev.nombre IN ('PENDIENTE_CONFIRMACION', 'INACTIVO', 'ACTIVO')
            """
    )
    Page<Vecino> buscarCuentasVecinales(
            @Param("texto") String texto,
            @Param("estado") String estado,
            Pageable pageable
    );

    @Query("""
        SELECT v
        FROM Vecino v
        JOIN FETCH v.estadoVecino
        WHERE v.id = :id
    """)
    Optional<Vecino> findDetalleById(@Param("id") Integer id);

    Optional<Vecino> findByEmailAndDni(String email, String dni);

    Optional<Vecino> findByKeycloakId(String keycloakId);

    Optional<Vecino> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Integer id);

}
