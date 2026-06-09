package com.tesis.municipalidadbackendapp.organizacion.entity;

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
@Table(name = "municipalidad")
public class Municipalidad {
    @Id
    @Column(name = "municipalidad_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @Column(name = "nombre", length = 45)
    private String nombre;

    @Size(max = 150)
    @Column(name = "distrito", length = 150)
    private String distrito;

    @Size(max = 45)
    @Column(name = "ruc", length = 45)
    private String ruc;

    @Size(max = 150)
    @Column(name = "direccion", length = 150)
    private String direccion;

    @Column(name = "activo")
    private Byte activo;


}