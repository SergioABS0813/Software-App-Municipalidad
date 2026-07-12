package com.tesis.municipalidadbackendapp.pago_inscripcion.repository;

import com.tesis.municipalidadbackendapp.pago_inscripcion.entity.PagoInscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PagoInscripcionRepository extends JpaRepository<PagoInscripcion, Integer> {
    Optional<PagoInscripcion> findByInscripcionId(Integer inscripcionId);

    @Query("""
        SELECT p
        FROM PagoInscripcion p
        JOIN FETCH p.inscripcion i
        JOIN FETCH i.evento e
        JOIN FETCH i.vecino v
        LEFT JOIN FETCH p.validadoPorUsuario u
        WHERE p.estadoPago IN :estados
          AND (
            :busqueda IS NULL
            OR LOWER(v.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%'))
            OR LOWER(v.dni) LIKE LOWER(CONCAT('%', :busqueda, '%'))
          )
    """)
    List<PagoInscripcion> findAllByEstadoPagoInConDetalle(
            @Param("estados") Collection<String> estados,
            @Param("busqueda") String busqueda
    );

    @Query("""
        SELECT p
        FROM PagoInscripcion p
        JOIN FETCH p.inscripcion i
        JOIN FETCH i.evento e
        JOIN FETCH i.vecino v
        LEFT JOIN FETCH p.validadoPorUsuario u
        WHERE p.estadoPago IN :estados
        ORDER BY p.fechaRegistro DESC, p.id DESC
    """)
    List<PagoInscripcion> findAllByEstadoPagoInConDetalle(@Param("estados") Collection<String> estados);

    @Query("""
        SELECT p
        FROM PagoInscripcion p
        JOIN FETCH p.inscripcion i
        JOIN FETCH i.evento e
        JOIN FETCH i.vecino v
        LEFT JOIN FETCH p.validadoPorUsuario u
        WHERE p.id = :id
    """)
    Optional<PagoInscripcion> findDetalleById(@Param("id") Integer id);

    @Query("""
        SELECT COALESCE(SUM(p.monto), 0)
        FROM PagoInscripcion p
        JOIN p.inscripcion i
        JOIN i.evento e
        WHERE e.id = :eventoId
          AND UPPER(p.estadoPago) = 'VALIDADO'
    """)
    BigDecimal sumMontoValidadoByEventoId(@Param("eventoId") Integer eventoId);
}