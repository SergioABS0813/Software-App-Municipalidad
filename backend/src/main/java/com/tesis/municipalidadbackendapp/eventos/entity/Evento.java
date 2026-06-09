package com.tesis.municipalidadbackendapp.eventos.entity;

import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.ubicacion.entity.Ubicacion;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "evento")
public class Evento {
    @Id
    @Column(name = "evento_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 100)
    @Column(name = "titulo", length = 100)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional=false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional=false)
    @JoinColumn(name="area_municipal_id", nullable = false)
    private AreaMunicipal areaMunicipal;

    @Column(name = "fecha_hora_inicio")
    private Instant fechaHoraInicio;

    @Column(name = "fecha_hora_fin")
    private Instant fechaHoraFin;

    @Column(name = "costo_referencial")
    private Float costoReferencial;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional=false)
    @JoinColumn(name = "estado_evento_id", nullable = false)
    private EstadoEvento estadoEvento;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional=false)
    @JoinColumn(name="ubicacion_id", nullable = false)
    private Ubicacion ubicacion;

    @Column(name = "aforo_maximo")
    private Integer aforoMaximo;

    @Size(max = 45)
    @Column(name = "meta_tipo", length = 45)
    private String metaTipo;

    @Column(name = "meta_valor")
    private Float metaValor;

    @Column(name = "encuesta_satisfaccion_habilitado")
    private Byte encuestaSatisfaccionHabilitado;

    @Column(name = "tiempo_creado")
    private Instant tiempoCreado;

    @Column(name = "tiempo_actualizado")
    private Instant tiempoActualizado;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional=false)
    @JoinColumn(name="usuario_id",  nullable = false)
    private Usuario usuario;

    @Column(name = "edad_min")
    private Byte edadMin;

    @Column(name = "edad_max")
    private Byte edadMax;

    @Column(name = "evento_actualizado_en")
    private Instant eventoActualizadoEn;

    @Size(max = 45)
    @Column(name = "descripcion_breve", length = 45)
    private String descripcionBreve;


}