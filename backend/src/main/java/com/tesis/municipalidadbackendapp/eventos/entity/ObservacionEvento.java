package com.tesis.municipalidadbackendapp.eventos.entity;

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
@Table(name = "observacion_evento")
public class ObservacionEvento {
    @Id
    @Column(name = "observacion_evento_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "fecha_observacion")
    private Instant fechaObservacion;

    @Size(max = 45)
    @Column(name = "estado", length = 45)
    private String estado;


}
