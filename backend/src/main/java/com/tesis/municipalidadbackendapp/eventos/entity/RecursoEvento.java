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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recurso_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @Column(name = "tipo_recurso", length = 45)
    private String tipoRecurso;

    @Size(max = 500)
    @Column(name = "object_path", length = 500)
    private String objectPath;

    @Size(max = 255)
    @Column(name = "nombre_original", length = 255)
    private String nombreOriginal;

    @Size(max = 100)
    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "fecha_subida")
    private Instant fechaSubida;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;
}