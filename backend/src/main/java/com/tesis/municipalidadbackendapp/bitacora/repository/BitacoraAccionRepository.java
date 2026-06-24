package com.tesis.municipalidadbackendapp.bitacora.repository;

import com.tesis.municipalidadbackendapp.bitacora.entity.BitacoraAccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface BitacoraAccionRepository extends JpaRepository<BitacoraAccion, Integer> {
    List<BitacoraAccion> findByEntidadAfectadaInAndEntidadIdOrderByFechaHoraDesc(
            Collection<String> entidadesAfectadas,
            Integer entidadId
    );
}
