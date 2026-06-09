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
@Table(name = "categoria")
public class Categoria {
    @Id
    @Column(name = "categoria_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @Column(name = "nombre", length = 45)
    private String nombre;


}