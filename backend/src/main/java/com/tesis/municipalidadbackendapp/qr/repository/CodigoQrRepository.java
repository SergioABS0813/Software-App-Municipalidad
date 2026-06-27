package com.tesis.municipalidadbackendapp.qr.repository;

import com.tesis.municipalidadbackendapp.qr.entity.CodigoQr;
import com.tesis.municipalidadbackendapp.qr.enums.EstadoQr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CodigoQrRepository extends JpaRepository<CodigoQr, Integer> {
    Optional<CodigoQr> findByToken(String token);

    List<CodigoQr> findByInscripcion_IdAndEstadoQr(Integer inscripcion_Id, EstadoQr estadoQr);

    @Modifying
    @Query("""
        UPDATE CodigoQr qr
        SET qr.estadoQr = com.tesis.municipalidadbackendapp.qr.enums.EstadoQr.REVOCADO
        WHERE qr.estadoQr = com.tesis.municipalidadbackendapp.qr.enums.EstadoQr.ACTIVO
          AND qr.inscripcion.evento.id = :eventoId
          AND qr.inscripcion.estadoInscripcion = com.tesis.municipalidadbackendapp.inscripciones.enums.EstadoInscripcion.CONFIRMADA
    """)
    int revocarActivosPorEvento(@Param("eventoId") Integer eventoId);


}
