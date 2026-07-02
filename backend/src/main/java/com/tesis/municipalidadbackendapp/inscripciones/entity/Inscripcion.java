package com.tesis.municipalidadbackendapp.inscripciones.entity;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.inscripciones.enums.EstadoInscripcion;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "inscripcion")
public class Inscripcion {
    @Id
    @Column(name = "inscripcion_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "fecha_inscripcion")
    private Instant fechaInscripcion;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @Size(max = 45)
    @Column(name = "origen_inscripcion", length = 45)
    private String origenInscripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_usuario_id")
    private Usuario registradoPorUsuario;

    @Size(max = 45)
    @Column(name = "codigo_inscripcion", length = 45)
    private String codigoInscripcion;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vecino_id", nullable = false)
    private Vecino vecino;

    @Enumerated(EnumType.STRING)
    @Column(name="estado_inscripcion", length = 45)
    private EstadoInscripcion estadoInscripcion;

    @Size(max = 45)
    @Column(name = "motivo_cancelacion", length = 45)
    private String motivoCancelacion;

    @Column(name = "observacion_cancelacion", columnDefinition = "TEXT")
    private String observacionCancelacion;

    @Column(name = "fecha_cancelacion")
    private Instant fechaCancelacion;


}