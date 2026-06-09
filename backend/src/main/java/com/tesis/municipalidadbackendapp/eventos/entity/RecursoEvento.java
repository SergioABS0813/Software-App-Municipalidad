package com.tesis.municipalidadbackendapp.eventos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "recurso_evento")
public class RecursoEvento {
    @Id
    @Column(name = "recurso_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 45)
    @Column(name = "tipo_recurso", length = 45)
    private String tipoRecurso;

    @Size(max = 45)
    @Column(name = "url_recurso", length = 45)
    private String urlRecurso;

    @Size(max = 45)
    @Column(name = "nombre_archivo", length = 45)
    private String nombreArchivo;

    @Column(name = "fecha_subida")
    private Instant fechaSubida;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

}