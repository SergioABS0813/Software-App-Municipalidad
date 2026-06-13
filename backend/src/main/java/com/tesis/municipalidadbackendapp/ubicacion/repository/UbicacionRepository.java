package com.tesis.municipalidadbackendapp.ubicacion.repository;

import com.tesis.municipalidadbackendapp.ubicacion.dto.UbicacionConfiguracionDto;
import com.tesis.municipalidadbackendapp.ubicacion.entity.Ubicacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UbicacionRepository extends JpaRepository<Ubicacion, Integer> {
    @Query("""
            select new com.tesis.municipalidadbackendapp.ubicacion.dto.UbicacionConfiguracionDto(
                ubicacion.id,
                ubicacion.nombre,
                ubicacion.direccion,
                ubicacion.referencia,
                ubicacion.latitud,
                ubicacion.longitud,
                ubicacion.activo,
                count(evento.id)
            )
            from Ubicacion ubicacion
            left join Evento evento on evento.ubicacion = ubicacion
            where (:texto is null or :texto = ''
                or lower(ubicacion.nombre) like lower(concat('%', :texto, '%'))
                or lower(ubicacion.direccion) like lower(concat('%', :texto, '%'))
                or lower(ubicacion.referencia) like lower(concat('%', :texto, '%'))
            )
            group by ubicacion.id, ubicacion.nombre, ubicacion.direccion, ubicacion.referencia,
                ubicacion.latitud, ubicacion.longitud, ubicacion.activo
            """)
    Page<UbicacionConfiguracionDto> findAllConfiguracion(
            @Param("texto") String texto,
            Pageable pageable
    );
}
