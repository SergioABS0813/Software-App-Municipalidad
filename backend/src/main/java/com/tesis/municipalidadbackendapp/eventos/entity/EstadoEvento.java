package com.tesis.municipalidadbackendapp.eventos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "estado_evento")
public class EstadoEvento {
    @Id
    @Column(name = "estado_evento_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @Column(name = "codigo", length = 45)
    private String codigo;


}