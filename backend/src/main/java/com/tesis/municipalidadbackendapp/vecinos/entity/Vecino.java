package com.tesis.municipalidadbackendapp.vecinos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "vecino")
public class Vecino {
    @Id
    @Column(name = "vecino_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 45)
    @Column(name = "nombre", length = 45)
    private String nombre;

    @Size(max = 45)
    @Column(name = "dni", length = 45)
    private String dni;

    @Size(max = 45)
    @Column(name = "email", length = 45)
    private String email;

    @Column(name = "tiempo_creado")
    private Instant tiempoCreado;

    @Column(name = "acepta_tratamiento_datos")
    private Byte aceptaTratamientoDatos;

    @Column(name = "fecha_nacimiento")
    private Instant fechaNacimiento;

    @Size(max = 255)
    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "fecha_aceptacion_datos")
    private Instant fechaAceptacionDatos;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estado_vecino_id", nullable = false)
    private EstadoVecino estadoVecino;


}