package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select evento
            from Evento evento
            where evento.id = :id
            """)
    java.util.Optional<Evento> findByIdForUpdate(@Param("id") Integer id);
    @Query("""
            select evento
            from Evento evento
            left join evento.categoria categoria
            left join evento.estadoEvento estado
            left join evento.ubicacion ubicacion
            left join evento.areaMunicipal area
            where (:texto is null or :texto = ''
                or lower(evento.titulo) like lower(concat('%', :texto, '%'))
                or lower(ubicacion.nombre) like lower(concat('%', :texto, '%'))
                or lower(area.nombre) like lower(concat('%', :texto, '%'))
                or lower(categoria.nombre) like lower(concat('%', :texto, '%'))
            )
            and (:estadoCodigo is null or :estadoCodigo = '' or estado.codigo = :estadoCodigo)
            and (:categoriaId is null or categoria.id = :categoriaId)
            and (:sinCategoria = false or evento.categoria is null)
            """)
    Page<Evento> findAllPanelAdministrativo(
            @Param("texto") String texto,
            @Param("estadoCodigo") String estadoCodigo,
            @Param("categoriaId") Integer categoriaId,
            @Param("sinCategoria") boolean sinCategoria,
            Pageable pageable
    );

    Integer countByEstadoEvento_CodigoAndFechaHoraFinGreaterThanEqual(
            String codigo,
            Instant ahora
    );

    Integer countByEstadoEventoCodigo(String codigo);

    Integer countByEstadoEventoCodigoIn(Collection<String> codigos);

    @Query("""
            select evento
            from Evento evento
            left join evento.estadoEvento estado
            where estado.codigo in :codigos
            """)
    Page<Evento> findAllRevisionDirectiva(
            @Param("codigos") Collection<String> codigos,
            Pageable pageable
    );

    @Query(
            value = """
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            left join fetch evento.categoria categoria
            left join fetch evento.ubicacion ubicacion
            left join fetch evento.areaMunicipal area
            where estado.codigo in ('PUBLICADO', 'EN_CURSO')
              and (:categoriaId is null or categoria.id = :categoriaId)
              and (:texto is null or :texto = ''
                or lower(evento.titulo) like lower(concat('%', :texto, '%'))
                or lower(ubicacion.nombre) like lower(concat('%', :texto, '%'))
                or lower(ubicacion.direccion) like lower(concat('%', :texto, '%'))
              )
            order by evento.fechaHoraInicio asc, evento.id asc
            """,
            countQuery = """
            select count(evento)
            from Evento evento
            left join evento.estadoEvento estado
            left join evento.categoria categoria
            left join evento.ubicacion ubicacion
            where estado.codigo in ('PUBLICADO', 'EN_CURSO')
              and (:categoriaId is null or categoria.id = :categoriaId)
              and (:texto is null or :texto = ''
                or lower(evento.titulo) like lower(concat('%', :texto, '%'))
                or lower(ubicacion.nombre) like lower(concat('%', :texto, '%'))
                or lower(ubicacion.direccion) like lower(concat('%', :texto, '%'))
              )
            """
    )
    Page<Evento> findAllPortalPublico(
            @Param("texto") String texto,
            @Param("categoriaId") Integer categoriaId,
            Pageable pageable
    );

    @Query("""
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            left join fetch evento.categoria categoria
            left join fetch evento.ubicacion ubicacion
            left join fetch evento.areaMunicipal area
            where estado.codigo = 'PUBLICADO'
              and evento.fechaHoraInicio >= :ahora
            order by evento.fechaHoraInicio asc, evento.id asc
            """)
    List<Evento> findNextPortalPublico(
            @Param("ahora") Instant ahora,
            Pageable pageable
    );
    @Query("""
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            left join fetch evento.categoria categoria
            left join fetch evento.ubicacion ubicacion
            left join fetch evento.areaMunicipal area
            where estado.codigo = 'EN_CURSO'
              and evento.fechaHoraInicio <= :ahora
              and evento.fechaHoraFin > :ahora
            order by evento.fechaHoraInicio asc, evento.id asc
            """)
    List<Evento> findEventosEnCursoPortalPublico(
            @Param("ahora") Instant ahora,
            Pageable pageable
    );

    @Query("""
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            left join fetch evento.ubicacion ubicacion
            where estado.codigo in ('PUBLICADO', 'EN_CURSO')
              and evento.fechaHoraInicio >= :inicio
              and evento.fechaHoraInicio < :fin
              and evento.recordatorioUnaHoraEnviadoEn is null
            order by evento.fechaHoraInicio asc, evento.id asc
            """)
    List<Evento> findEventosParaRecordatorioUnaHora(
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );
    @Query("""
            select count(evento)
            from Evento evento
            left join evento.estadoEvento estado
            where estado.codigo in :codigos
              and coalesce(evento.eventoActualizadoEn, evento.tiempoActualizado, evento.tiempoCreado)
                  >= :inicio
              and coalesce(evento.eventoActualizadoEn, evento.tiempoActualizado, evento.tiempoCreado)
                  < :fin
            """)
    Long countByEstadoCodigoInAndFechaActualizacionBetween(
            @Param("codigos") Collection<String> codigos,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            left join fetch evento.categoria categoria
            left join fetch evento.ubicacion ubicacion
            left join fetch evento.areaMunicipal area
            where estado.codigo in :codigos
            """)
    List<Evento> findAllReportesDirectivosFinalizados(@Param("codigos") Collection<String> codigos);
    Long countByUbicacionId(Integer ubicacionId);

    Long countByCategoriaId(Integer categoriaId);

    @Query("""
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            where estado.codigo = 'PUBLICADO'
              and evento.fechaHoraInicio <= :ahora
              and evento.fechaHoraFin > :ahora
            """)
    List<Evento> findEventosPublicadosParaMarcarEnCurso(@Param("ahora") Instant ahora);
    @Query("""
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            where estado.codigo in ('PUBLICADO', 'EN_CURSO')
              and evento.fechaHoraFin is not null
              and evento.fechaHoraFin <= :ahora
            """)
    List<Evento> findEventosParaMarcarFinalizado(@Param("ahora") Instant ahora);
    @Query("""
            select evento
            from Evento evento
            left join fetch evento.estadoEvento estado
            where estado.codigo = 'FINALIZADO'
              and evento.encuestaSatisfaccionHabilitado = 1
            order by evento.fechaHoraFin asc, evento.id asc
            """)
    List<Evento> findEventosFinalizadosConEncuestaSatisfaccionHabilitada();
}