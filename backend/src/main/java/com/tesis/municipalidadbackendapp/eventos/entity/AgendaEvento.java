package com.tesis.municipalidadbackendapp.eventos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "agenda_evento")
public class AgendaEvento {
    @Id
    @Column(name = "agenda_evento_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @Column(name = "descripcion", length = 45)
    private String descripcion;

    @Column(name = "orden")
    private Integer orden;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;


}