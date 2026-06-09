package com.tesis.municipalidadbackendapp.inscripciones.entity;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
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


}