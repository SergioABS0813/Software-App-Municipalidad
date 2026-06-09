package com.tesis.municipalidadbackendapp.usuariosinternos.entity;

import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @Column(name = "usuario_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @NotNull
    @Column(name = "nombres", nullable = false, length = 45)
    private String nombres;

    @Size(max = 45)
    @NotNull
    @Column(name = "apellidos", nullable = false, length = 45)
    private String apellidos;

    @Size(max = 45)
    @Column(name = "dni", length = 45)
    private String dni;

    @Size(max = 45)
    @Column(name = "email", length = 45)
    private String email;

    @Size(max = 45)
    @Column(name = "password", length = 45)
    private String password;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rol_id", nullable = false)
    private Rol rol;

    @Column(name = "activo")
    private Byte activo;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "area_municipal_id", nullable = false)
    private AreaMunicipal areaMunicipal;


}
