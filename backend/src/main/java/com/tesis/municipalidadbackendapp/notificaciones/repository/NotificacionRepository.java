package com.tesis.municipalidadbackendapp.notificaciones.repository;

import com.tesis.municipalidadbackendapp.notificaciones.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion,Integer> {

    List<Notificacion> findByUsuarioDestino_IdOrderByFechaCreacionDesc(Integer usuarioId);

    List<Notificacion> findByUsuarioDestino_IdAndLeidaFalseOrderByFechaCreacionDesc(Integer usuarioId);

    Integer countByUsuarioDestino_Id(Integer usuarioId);

    Integer countByUsuarioDestino_IdAndLeidaFalse(Integer usuarioId);
}
