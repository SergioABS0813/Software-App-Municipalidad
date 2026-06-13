package com.tesis.municipalidadbackendapp.ubicacion.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "ubicacion")
public class Ubicacion {
    @Id
    @Column(name = "ubicacion_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 100)
    @Column(name = "nombre", length = 100)
    private String nombre;

    @Size(max = 100)
    @Column(name = "direccion", length = 100)
    private String direccion;

    @Size(max = 100)
    @Column(name = "referencia", length = 100)
    private String referencia;

    @Column(name = "latitud", precision = 10)
    private BigDecimal latitud;

    @Column(name = "longitud", precision = 10)
    private BigDecimal longitud;

    @Column(name = "activo")
    private Byte activo;


}