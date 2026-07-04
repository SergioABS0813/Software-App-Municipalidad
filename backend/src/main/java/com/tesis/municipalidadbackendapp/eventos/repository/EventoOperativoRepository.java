package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.EventoOperativo;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface EventoOperativoRepository extends JpaRepository<EventoOperativo, Integer> {

    List<EventoOperativo> findByEvento(Evento evento);

    List<EventoOperativo> findByEventoAndActivo(Evento evento, Byte activo);

    @Query("""
            select eo
            from EventoOperativo eo
            join fetch eo.usuario usuario
            where eo.evento.id = :eventoId
              and eo.activo = 1
              and usuario.email is not null
              and trim(usuario.email) <> ''
            """)
    List<EventoOperativo> findActivosConUsuarioParaRecordatorio(@Param("eventoId") Integer eventoId);

    long countByEventoAndActivo(Evento evento, Byte activo);

    boolean existsByEventoIdAndUsuarioIdAndActivo(Integer eventoId, Integer usuarioId, Byte activo);

    @Query("""
            select eo.evento
            from EventoOperativo eo
            join eo.evento evento
            join evento.estadoEvento estado
            where eo.usuario = :usuario
              and eo.activo = 1
              and evento.requiereControlAsistencia = 1
              and evento.fechaHoraInicio < :fin
              and evento.fechaHoraFin >= :inicio
              and estado.codigo in :estados
            order by
              case
                when evento.fechaHoraInicio <= :ahora and evento.fechaHoraFin >= :ahora then 0
                when evento.fechaHoraInicio >= :ahora then 1
                else 2
              end,
              evento.fechaHoraInicio asc,
              evento.id asc
            """)
    List<Evento> findEventosAsignadosDelDia(
            @Param("usuario") Usuario usuario,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("ahora") Instant ahora,
            @Param("estados") Collection<String> estados
    );
}
