package com.tesis.municipalidadbackendapp.notificaciones.repository;

import com.tesis.municipalidadbackendapp.notificaciones.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion,Integer> {

    List<Notificacion> findByUsuario_IdOrderByFechaCreacionDesc(Integer usuarioId);

    List<Notificacion> findByUsuario_IdAndLeidaFalseOrderByFechaCreacionDesc(Integer usuarioId);

    Integer countByUsuario_Id(Integer usuarioId);

    Integer countByUsuario_IdAndLeidaFalse(Integer usuarioId);
}
