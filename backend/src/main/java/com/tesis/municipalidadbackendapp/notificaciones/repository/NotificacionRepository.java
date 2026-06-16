package com.tesis.municipalidadbackendapp.notificaciones.repository;

import com.tesis.municipalidadbackendapp.notificaciones.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion,Integer> {

    @Query("""
        SELECT n
        FROM Notificacion n
        WHERE n.usuarioDestino.id = :usuarioId
        AND (n.fechaExpiracion IS NULL OR n.fechaExpiracion > :ahora)
        ORDER BY n.fechaCreacion DESC
    """)
    List<Notificacion> findVigentesByUsuarioDestinoIdOrderByFechaCreacionDesc(Integer usuarioId, Instant ahora);

    @Query("""
        SELECT n
        FROM Notificacion n
        WHERE n.usuarioDestino.id = :usuarioId
        AND (n.leida IS NULL OR n.leida = 0)
        AND (n.fechaExpiracion IS NULL OR n.fechaExpiracion > :ahora)
        ORDER BY n.fechaCreacion DESC
    """)
    List<Notificacion> findNoLeidasVigentesByUsuarioDestinoIdOrderByFechaCreacionDesc(Integer usuarioId, Instant ahora);

    @Query("""
        SELECT COUNT(n)
        FROM Notificacion n
        WHERE n.usuarioDestino.id = :usuarioId
        AND (n.fechaExpiracion IS NULL OR n.fechaExpiracion > :ahora)
    """)
    Integer countVigentesByUsuarioDestinoId(Integer usuarioId, Instant ahora);

    @Query("""
        SELECT COUNT(n)
        FROM Notificacion n
        WHERE n.usuarioDestino.id = :usuarioId
        AND (n.leida IS NULL OR n.leida = 0)
        AND (n.fechaExpiracion IS NULL OR n.fechaExpiracion > :ahora)
    """)
    Integer countNoLeidasVigentesByUsuarioDestinoId(Integer usuarioId, Instant ahora);
}
