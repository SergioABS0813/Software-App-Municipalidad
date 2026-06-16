package com.tesis.municipalidadbackendapp.valoraciones.entity;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(
        name = "valoracion_evento",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_valoracion_evento_inscripcion", columnNames = "inscripcion_id"),
                @UniqueConstraint(name = "uk_valoracion_evento_token", columnNames = "token")
        }
)
public class ValoracionEvento {
    @Id
    @Column(name = "valoracion_evento_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inscripcion_id", nullable = false)
    private Inscripcion inscripcion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vecino_id", nullable = false)
    private Vecino vecino;

    @Column(name = "token", nullable = false, length = 120)
    private String token;

    @Column(name = "puntuacion")
    private Byte puntuacion;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    @Column(name = "fecha_generacion", nullable = false)
    private Instant fechaGeneracion;

    @Column(name = "fecha_expiracion")
    private Instant fechaExpiracion;

    @Column(name = "fecha_respuesta")
    private Instant fechaRespuesta;
}
