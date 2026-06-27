package com.tesis.municipalidadbackendapp.qr.repository;

import com.tesis.municipalidadbackendapp.qr.entity.CodigoQr;
import com.tesis.municipalidadbackendapp.qr.enums.EstadoQr;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodigoQrRepository extends JpaRepository<CodigoQr, Integer> {
    Optional<CodigoQr> findByToken(String token);

    List<CodigoQr> findByInscripcion_IdAndEstadoQr(Integer inscripcion_Id, EstadoQr estadoQr);


}
