package com.tesis.municipalidadbackendapp.organizacion.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "area_municipal")
public class AreaMunicipal {
    @Id
    @Column(name = "area_municipal_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 100)
    @Column(name = "nombre", length = 100)
    private String nombre;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "municipalidad_id", nullable = false)
    private Municipalidad municipalidad;

    @NotNull
    @Column(name = "organizar_eventos", nullable = false)
    private Byte organizarEventos;

    @Size(max = 100)
    @Column(name = "tipo_area", length = 100)
    private String tipoArea;


}