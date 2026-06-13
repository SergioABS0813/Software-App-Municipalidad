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

    @Size(max = 100)
    @Column(name = "keycloak_id", length = 100)
    private String keycloakId;

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
    private Instant fechaCreado;

    @Column(name = "acepta_tratamiento_datos")
    private Byte aceptaTratamientoDatos;

    @Column(name = "fecha_nacimiento")
    private Instant fechaNacimiento;

    @Column(name = "fecha_aceptacion_datos")
    private Instant fechaAceptacionDatos;

    @Column(name="celular", length = 15)
    private String celular;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estado_vecino_id", nullable = false)
    private EstadoVecino estadoVecino;


}
